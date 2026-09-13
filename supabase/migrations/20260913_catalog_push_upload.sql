-- Catalog variants, admin Web Push subscriptions, and private upload writes.
-- Run this migration after the existing order-flow migration.

alter table public.products add column if not exists description text;
alter table public.products add column if not exists menu_id uuid;
alter table public.products add column if not exists variant_name text;

create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products
  drop constraint if exists products_menu_id_fkey;

alter table public.products
  add constraint products_menu_id_fkey
  foreign key (menu_id) references public.menus(id) on delete set null;

create index if not exists products_menu_id_idx on public.products(menu_id);
alter table public.menus drop constraint if exists menus_name_exact_unique;
alter table public.menus add constraint menus_name_exact_unique unique (name);

alter table public.menus enable row level security;
drop policy if exists menus_public_read on public.menus;
create policy menus_public_read
  on public.menus for select to anon, authenticated
  using (is_active = true);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
revoke all on public.menus from anon, authenticated;
grant select on public.menus to anon, authenticated;
revoke all on public.push_subscriptions from public, anon, authenticated;

insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists menu_images_public_read on storage.objects;
create policy menu_images_public_read
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'menu-images');

insert into public.menus (name, description, image_url)
select p.name, p.description, p.image_url
from public.products p
where p.menu_id is null
on conflict (name) do nothing;

update public.products p
set menu_id = m.id,
    variant_name = null
from public.menus m
where p.menu_id is null and lower(m.name) = lower(p.name);

create or replace function public.create_order_atomic(
  p_order_number text,
  p_customer_name text,
  p_customer_phone text,
  p_shipping_address text,
  p_notes text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_requested_count integer;
  v_distinct_count integer;
  v_available_count integer;
  v_total numeric;
  v_snapshots jsonb;
begin
  if p_order_number is null or p_order_number !~ '^KUL-[0-9]{8}-[A-F0-9]{8}$' then
    raise exception using errcode = '22023', message = 'Nomor order tidak valid';
  end if;
  if p_customer_name is null or length(trim(p_customer_name)) < 3 then
    raise exception using errcode = '22023', message = 'Nama pelanggan tidak valid';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023', message = 'Keranjang kosong';
  end if;

  select count(*) into v_requested_count
  from jsonb_to_recordset(p_items) as item(id uuid, quantity integer);
  select count(*) into v_distinct_count
  from (select item.id from jsonb_to_recordset(p_items) as item(id uuid, quantity integer) group by item.id) distinct_items;

  if v_requested_count <> v_distinct_count or exists (
    select 1 from jsonb_to_recordset(p_items) as item(id uuid, quantity integer)
    where item.id is null or item.quantity is null or item.quantity <= 0 or item.quantity > 100
  ) then
    raise exception using errcode = '22023', message = 'Item order tidak valid';
  end if;

  with requested as (
    select item.id, item.quantity from jsonb_to_recordset(p_items) as item(id uuid, quantity integer)
  )
  select count(*) into v_available_count
  from requested r join public.products p on p.id = r.id
  where p.is_active = true and p.stock >= r.quantity;

  if v_available_count <> v_distinct_count then
    raise exception using errcode = 'P0001', message = 'Stok berubah atau produk tidak tersedia';
  end if;

  with requested as (
    select item.id, item.quantity from jsonb_to_recordset(p_items) as item(id uuid, quantity integer)
  )
  select coalesce(sum(p.price * r.quantity), 0), jsonb_agg(jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'menu_name', m.name,
    'variant_name', p.variant_name,
    'price', p.price,
    'quantity', r.quantity
  ) order by coalesce(m.name, p.name), p.variant_name nulls first, p.name)
  into v_total, v_snapshots
  from requested r
  join public.products p on p.id = r.id
  left join public.menus m on m.id = p.menu_id
  where p.is_active = true;

  insert into public.orders (
    order_number, order_id, customer_name, customer_phone, shipping_address,
    customer_address, notes, total_amount, items, status
  ) values (
    p_order_number, p_order_number, trim(p_customer_name), trim(p_customer_phone),
    trim(p_shipping_address), trim(p_shipping_address), nullif(trim(p_notes), ''),
    v_total, v_snapshots, 'unpaid'
  ) returning id into v_order_id;

  insert into public.order_items (order_id, product_id, quantity, price_at_time)
  select v_order_id, item.id, item.quantity, p.price
  from jsonb_to_recordset(p_items) as item(id uuid, quantity integer)
  join public.products p on p.id = item.id and p.is_active = true;

  return jsonb_build_object('order_id', v_order_id, 'order_number', p_order_number, 'total_amount', v_total, 'items', v_snapshots);
end;
$$;

revoke execute on function public.create_order_atomic(text, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.create_order_atomic(text, text, text, text, text, jsonb) to service_role;