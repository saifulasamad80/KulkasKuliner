-- Menambahkan kolom modal/harga-beli per produk supaya admin bisa lihat
-- keuntungan bersih (harga jual - modal), bukan cuma pendapatan kotor.
-- Default 0 untuk produk lama yang belum diisi modalnya -- ditandai di UI
-- admin sebagai "modal belum diisi" alih-alih dianggap untung 100%.

alter table public.products add column if not exists cost_price integer not null default 0;
alter table public.products add constraint products_cost_price_non_negative check (cost_price >= 0);

-- create_variant_menu_atomic perlu terima cost_price per varian juga, jadi
-- fungsi ini di-replace utuh dengan tambahan kolom itu di validasi + insert.
create or replace function public.create_variant_menu_atomic(
  p_menu_name text,
  p_description text,
  p_image_url text,
  p_variants jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_menu_id uuid;
  v_menu_name text := trim(coalesce(p_menu_name, ''));
  v_description text := trim(coalesce(p_description, ''));
  v_image_url text := trim(coalesce(p_image_url, ''));
  v_variant_count integer;
  v_distinct_variant_count integer;
begin
  if length(v_menu_name) < 2 or length(v_menu_name) > 120 then
    raise exception using errcode = '22023', message = 'Nama menu tidak valid';
  end if;
  if length(v_description) > 500 or length(v_image_url) > 2000 then
    raise exception using errcode = '22023', message = 'Metadata menu tidak valid';
  end if;
  if p_variants is null or jsonb_typeof(p_variants) <> 'array' then
    raise exception using errcode = '22023', message = 'Daftar varian tidak valid';
  end if;

  select count(*), count(distinct lower(trim(variant_name)))
  into v_variant_count, v_distinct_variant_count
  from jsonb_to_recordset(p_variants) as variant(variant_name text, price numeric, stock integer, cost_price numeric);

  if v_variant_count < 2 or v_variant_count > 25 or v_distinct_variant_count <> v_variant_count then
    raise exception using errcode = '22023', message = 'Varian wajib unik dan berjumlah 2 sampai 25';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_variants) as variant(variant_name text, price numeric, stock integer, cost_price numeric)
    where variant_name is null
      or length(trim(variant_name)) < 1
      or length(trim(variant_name)) > 120
      or price is null
      or price <= 0
      or price <> trunc(price)
      or stock is null
      or stock < 0
      or coalesce(cost_price, 0) < 0
      or coalesce(cost_price, 0) <> trunc(coalesce(cost_price, 0))
  ) then
    raise exception using errcode = '22023', message = 'Data varian tidak valid';
  end if;

  -- Serialisasi pembuatan nama menu yang sama, termasuk beda kapitalisasi.
  perform pg_advisory_xact_lock(hashtextextended(lower(v_menu_name), 0));

  select m.id
  into v_menu_id
  from public.menus m
  where lower(trim(m.name)) = lower(v_menu_name)
  order by m.created_at
  limit 1
  for update;

  if v_menu_id is not null then
    if exists (select 1 from public.products where menu_id = v_menu_id) then
      raise exception using errcode = 'P0001', message = 'Menu ini sudah punya produk';
    end if;

    update public.menus
    set name = v_menu_name,
        description = nullif(v_description, ''),
        image_url = nullif(v_image_url, ''),
        is_active = true
    where id = v_menu_id;
  else
    insert into public.menus (name, description, image_url, is_active)
    values (v_menu_name, nullif(v_description, ''), nullif(v_image_url, ''), true)
    returning id into v_menu_id;
  end if;

  insert into public.products (name, price, stock, image_url, description, menu_id, variant_name, is_active, cost_price)
  select
    v_menu_name,
    variant.price,
    variant.stock,
    v_image_url,
    v_description,
    v_menu_id,
    trim(variant.variant_name),
    true,
    coalesce(variant.cost_price, 0)
  from jsonb_to_recordset(p_variants) as variant(variant_name text, price numeric, stock integer, cost_price numeric);

  return jsonb_build_object('menu_id', v_menu_id, 'variant_count', v_variant_count);
end;
$$;

revoke execute on function public.create_variant_menu_atomic(text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.create_variant_menu_atomic(text, text, text, jsonb) to service_role;
