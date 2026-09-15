-- Jalankan setelah memeriksa duplicate order_number pada database produksi.
-- Fungsi ini menjadi satu-satunya jalur pembuatan order dari aplikasi.

alter table public.orders add column if not exists order_id text;
alter table public.orders add column if not exists customer_address text;
alter table public.orders add column if not exists notes text;
alter table public.orders add column if not exists items jsonb;

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.store_settings enable row level security;

revoke all on public.orders from anon, authenticated;
revoke all on public.order_items from anon, authenticated;
revoke all on public.store_settings from anon, authenticated;
revoke insert, update, delete on public.products from anon, authenticated;

do $$
begin
  if to_regclass('public.tbl_kodepos') is not null then
    execute 'alter table public.tbl_kodepos enable row level security';
    execute 'revoke insert, update, delete on public.tbl_kodepos from anon, authenticated';
  end if;
end;
$$;

drop policy if exists products_public_read on public.products;
create policy products_public_read
  on public.products
  for select
  to anon, authenticated
  using (is_active = true);

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
  from (
    select item.id
    from jsonb_to_recordset(p_items) as item(id uuid, quantity integer)
    group by item.id
  ) distinct_items;

  if v_requested_count <> v_distinct_count
     or exists (
       select 1
       from jsonb_to_recordset(p_items) as item(id uuid, quantity integer)
       where item.id is null or item.quantity is null or item.quantity <= 0 or item.quantity > 100
     ) then
    raise exception using errcode = '22023', message = 'Item order tidak valid';
  end if;

  with requested as (
    select item.id, item.quantity
    from jsonb_to_recordset(p_items) as item(id uuid, quantity integer)
  )
  select count(*)
  into v_available_count
  from requested r
  join public.products p on p.id = r.id
  where p.is_active = true
    and p.stock >= r.quantity;

  if v_available_count <> v_distinct_count then
    raise exception using errcode = 'P0001', message = 'Stok berubah atau produk tidak tersedia';
  end if;

  with requested as (
    select item.id, item.quantity
    from jsonb_to_recordset(p_items) as item(id uuid, quantity integer)
  )
  select
    coalesce(sum(p.price * r.quantity), 0),
    jsonb_agg(jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'price', p.price,
      'quantity', r.quantity
    ) order by p.name)
  into v_total, v_snapshots
  from requested r
  join public.products p on p.id = r.id
  where p.is_active = true;

  insert into public.orders (
    order_number,
    order_id,
    customer_name,
    customer_phone,
    shipping_address,
    customer_address,
    notes,
    total_amount,
    items,
    status
  )
  values (
    p_order_number,
    p_order_number,
    trim(p_customer_name),
    trim(p_customer_phone),
    trim(p_shipping_address),
    trim(p_shipping_address),
    nullif(trim(p_notes), ''),
    v_total,
    v_snapshots,
    'unpaid'
  )
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, quantity, price_at_time)
  select v_order_id, item.id, item.quantity, p.price
  from jsonb_to_recordset(p_items) as item(id uuid, quantity integer)
  join public.products p on p.id = item.id
  where p.is_active = true;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', p_order_number,
    'total_amount', v_total,
    'items', v_snapshots
  );
end;
$$;

create or replace function public.process_order_approval_secure(
  p_order_id text,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_action text := upper(trim(p_action));
begin
  select *
  into v_order
  from public.orders
  where id::text = p_order_id or order_number = p_order_id or order_id = p_order_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Order tidak ditemukan';
  end if;

  if v_action = 'REJECT' then
    if v_order.status <> 'unpaid' then
      raise exception using errcode = 'P0001', message = 'Order sudah diproses';
    end if;

    update public.orders set status = 'canceled' where id = v_order.id;
    return jsonb_build_object('status', 'canceled', 'order_number', v_order.order_number);
  end if;

  if v_action <> 'APPROVE' or v_order.status <> 'unpaid' then
    raise exception using errcode = 'P0001', message = 'Aksi atau status order tidak valid';
  end if;

  for v_item in
    select oi.product_id, oi.quantity
    from public.order_items oi
    where oi.order_id = v_order.id
    order by oi.product_id
    for update
  loop
    update public.products
    set stock = stock - v_item.quantity
    where id = v_item.product_id
      and is_active = true
      and stock >= v_item.quantity;

    if not found then
      raise exception using errcode = 'P0001', message = 'Stok tidak mencukupi';
    end if;
  end loop;

  update public.orders set status = 'paid' where id = v_order.id;
  return jsonb_build_object('status', 'paid', 'order_number', v_order.order_number);
end;
$$;

revoke execute on function public.create_order_atomic(text, text, text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.process_order_approval_secure(text, text) from public, anon, authenticated;
grant execute on function public.create_order_atomic(text, text, text, text, text, jsonb) to service_role;
grant execute on function public.process_order_approval_secure(text, text) to service_role;

create unique index if not exists orders_order_number_unique
  on public.orders (order_number);
