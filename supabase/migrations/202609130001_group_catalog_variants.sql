-- Kelompokkan produk yang sama menjadi satu menu dengan beberapa varian.
-- Row products TIDAK dihapus dan stok tiap varian tetap terpisah.
-- Jalankan setelah 20260913_catalog_push_upload.sql.

insert into public.menus (name, is_active)
values
  ('Pasta', true),
  ('Pizza Pan', true),
  ('Durian', true)
on conflict (name) do update
set is_active = true;

-- Contoh nama: "Pasta - Fusilli Brulee"
update public.products p
set menu_id = m.id,
    variant_name = nullif(trim(regexp_replace(p.name, '^Pasta\s*-\s*', '', 'i')), '')
from public.menus m
where m.name = 'Pasta'
  and p.name ~* '^Pasta\s*-\s*';

-- Contoh nama: "Pizza Pan Chicken BlackPaper"
update public.products p
set menu_id = m.id,
    variant_name = nullif(trim(regexp_replace(p.name, '^Pizza\s+Pan\s+', '', 'i')), '')
from public.menus m
where m.name = 'Pizza Pan'
  and p.name ~* '^Pizza\s+Pan\s+';

-- Contoh nama: "Durian Montong" atau "Durian Musang King"
update public.products p
set menu_id = m.id,
    variant_name = nullif(trim(regexp_replace(p.name, '^Durian\s+', '', 'i')), '')
from public.menus m
where m.name = 'Durian'
  and p.name ~* '^Durian\s+';

-- Pakai foto/deskripsi produk pertama sebagai default kartu induk jika menu
-- belum punya metadata sendiri. Foto tiap varian tetap dipakai jika tersedia.
update public.menus m
set image_url = coalesce(m.image_url, source.image_url),
    description = coalesce(m.description, source.description)
from (
  select distinct on (p.menu_id)
    p.menu_id,
    p.image_url,
    p.description
  from public.products p
  where p.menu_id is not null
    and p.menu_id in (select id from public.menus where name in ('Pasta', 'Pizza Pan', 'Durian'))
  order by p.menu_id, p.id
) source
where m.id = source.menu_id;

create index if not exists products_menu_variant_name_idx
  on public.products(menu_id, variant_name);