-- Statistik penggunaan PWA: berapa perangkat unik yang membuka katalog lewat
-- PWA (terpasang di layar utama) vs browser biasa, dan dari mana pesanan datang.
--
-- Privasi: visitor_id adalah UUID acak yang dibuat di perangkat pengunjung
-- (localStorage). Tidak ada nama, nomor HP, atau data pribadi di tabel ini.
-- Satu perangkat dihitung sekali per hari per mode (unique constraint di bawah).

create table if not exists public.pwa_visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null check (visitor_id ~ '^[A-Za-z0-9_-]{8,64}$'),
  display_mode text not null check (display_mode in ('pwa', 'browser')),
  visit_date date not null,
  created_at timestamptz not null default now(),
  unique (visitor_id, visit_date, display_mode)
);

create index if not exists pwa_visits_date_mode_idx
  on public.pwa_visits (visit_date, display_mode);

-- Tabel ini cuma boleh disentuh server (service_role), sama seperti
-- push_subscriptions: RLS aktif tanpa policy + semua hak publik dicabut.
alter table public.pwa_visits enable row level security;
revoke all on public.pwa_visits from public, anon, authenticated;

-- Sumber pesanan, diisi server setelah order dibuat. Pesanan lama tetap NULL
-- (dihitung sebagai "belum terlacak" di dashboard, bukan ditebak).
alter table public.orders add column if not exists order_source text;
alter table public.orders add column if not exists visitor_id text;

alter table public.orders drop constraint if exists orders_order_source_check;
alter table public.orders
  add constraint orders_order_source_check
  check (order_source is null or order_source in ('pwa', 'browser'));

create index if not exists orders_source_created_idx
  on public.orders (order_source, created_at);
