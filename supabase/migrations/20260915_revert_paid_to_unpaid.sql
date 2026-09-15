-- Menambahkan aksi REVERT_TO_UNPAID pada process_order_approval_secure.
-- Dipakai saat admin salah klik "Terima Pembayaran" dan perlu membatalkan
-- verifikasi: stok yang sudah dipotong saat APPROVE dikembalikan secara
-- atomik, lalu status order dikembalikan ke 'unpaid'. Hanya bisa dijalankan
-- dari status 'paid' (order yang sudah 'canceled'/'completed' tidak bisa
-- di-revert lewat aksi ini).

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

  if v_action = 'REVERT_TO_UNPAID' then
    if v_order.status <> 'paid' then
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

revoke execute on function public.process_order_approval_secure(text, text) from public, anon, authenticated;
grant execute on function public.process_order_approval_secure(text, text) to service_role;
