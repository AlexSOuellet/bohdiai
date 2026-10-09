-- Downgrading to Showcase (Saltmarsh & Lace demo spec, stage two): the maker picks up
-- to 12 of her products to show on the one-page site. Kept here until the downgrade
-- takes effect at renewal, when they become her gallery.
alter table public.tenants
  add column if not exists plan_next_gallery uuid[];
