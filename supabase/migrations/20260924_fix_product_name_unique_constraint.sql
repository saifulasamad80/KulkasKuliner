-- Root cause of "duplicate key value violates unique constraint
-- unique_product_name": the products table has a UNIQUE constraint on
-- `name` alone, but every variant-menu row (create_variant_menu_atomic,
-- and the newer "add variant to existing menu" feature) intentionally
-- shares the SAME `name` across all its variants -- only `variant_name`
-- differs per row. That's fundamental to how variant grouping works in
-- this app (see getProductMenu / displayName logic on the frontend).
--
-- This constraint has likely been silently blocking creation of any
-- genuinely new 2+ variant menu via create_variant_menu_atomic (the 2nd
-- variant row in the same batch insert would collide with the 1st).
--
-- Fix: keep protecting against duplicate names for standalone (non-variant)
-- products, but allow multiple rows to share a name once they're variants
-- of the same menu (variant_name is not null).

alter table public.products drop constraint if exists unique_product_name;

create unique index if not exists unique_single_product_name
  on public.products (name)
  where variant_name is null;
