-- Kunci jalur lama yang masih kebuka ke publik:
-- 1) RPC SECURITY DEFINER (process_checkout, process_telegram_approval, get_total_revenue)
--    bisa dipanggil anon dan jadi pintu approve/potong stok/baca omzet.
-- 2) Trigger rollback_stock_on_cancel nambah stok saat unpaid -> canceled,
--    padahal stok unpaid belum pernah dipotong (stok menggelembung).
-- 3) Policy MVP + GRANT TRUNCATE di products/kodepos.
-- 4) Status 'PAID' dari process_telegram_approval dirapikan ke 'paid'.

drop trigger if exists trigger_cancel_order_stock on public.orders;
drop function if exists public.rollback_stock_on_cancel();
drop function if exists public.process_checkout(text, text, text, public.cart_item[]);
drop function if exists public.process_telegram_approval(text, text);
drop function if exists public.get_total_revenue();

drop policy if exists "Allow anonymous insert to orders" on public.orders;
drop policy if exists "MVP_Admin_Read_Orders" on public.orders;
drop policy if exists "MVP_Admin_Update_Orders" on public.orders;
drop policy if exists "MVP_Admin_Read_OrderItems" on public.order_items;
drop policy if exists "Allow public read access" on public.store_settings;
drop policy if exists "MVP_Insert_Products" on public.products;
drop policy if exists "MVP_Read_Products" on public.products;
drop policy if exists "MVP_Update_Products" on public.products;
drop policy if exists "Izinkan akses baca publik untuk katalog" on public.products;
drop policy if exists "Publik boleh baca kode pos" on public.tbl_kodepos;

revoke all on public.orders from public, anon, authenticated;
revoke all on public.order_items from public, anon, authenticated;
revoke all on public.store_settings from public, anon, authenticated;
revoke all on public.push_subscriptions from public, anon, authenticated;
revoke all on public.products from public, anon, authenticated;
revoke all on public.menus from public, anon, authenticated;
revoke all on public.tbl_kodepos from public, anon, authenticated;

grant select on public.products to anon, authenticated;
grant select on public.menus to anon, authenticated;

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
  v_status text;
begin
  select *
  into v_order
  from public.orders
  where id::text = p_order_id or order_number = p_order_id or order_id = p_order_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Order tidak ditemukan';
  end if;

  v_status := lower(coalesce(v_order.status, ''));

  if v_action = 'REJECT' then
    if v_status <> 'unpaid' then
      raise exception using errcode = 'P0001', message = 'Order sudah diproses';
    end if;

    update public.orders set status = 'canceled' where id = v_order.id;
    return jsonb_build_object('status', 'canceled', 'order_number', v_order.order_number);
  end if;

  if v_action = 'REVERT_TO_UNPAID' then
    if v_status <> 'paid' then
      raise exception using errcode = 'P0001', message = 'Hanya pesanan berstatus paid yang bisa dikembalikan ke unpaid';
    end if;

    for v_item in
      select oi.product_id, oi.quantity
      from public.order_items oi
      where oi.order_id = v_order.id
      order by oi.product_id
      for update
    loop
      update public.products
      set stock = stock + v_item.quantity
      where id = v_item.product_id;

      if not found then
        raise exception using errcode = 'P0001', message = 'Produk tidak ditemukan saat mengembalikan stok';
      end if;
    end loop;

    update public.orders set status = 'unpaid' where id = v_order.id;
    return jsonb_build_object('status', 'unpaid', 'order_number', v_order.order_number);
  end if;

  if v_action <> 'APPROVE' or v_status <> 'unpaid' then
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

revoke execute on function public.process_order_approval_secure(text, text) from public, anon, authenticated;
revoke execute on function public.create_order_atomic(text, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.process_order_approval_secure(text, text) to service_role;
grant execute on function public.create_order_atomic(text, text, text, text, text, jsonb) to service_role;

update public.orders
set status = lower(status)
where status is not null
  and status <> lower(status);

alter table public.orders
  drop constraint if exists orders_status_allowed;

alter table public.orders
  add constraint orders_status_allowed
  check (status in ('unpaid', 'paid', 'canceled', 'completed'));
