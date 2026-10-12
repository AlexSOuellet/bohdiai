-- The plan a site is on (Saltmarsh & Lace demo spec): Maker Showcase, Lite or Full.
-- Null for sites built before plans, and for contractor sites until they get one.
-- The backend's Your plan screen reads it; the plan switch (stage two) writes it.
alter table public.tenants
  add column if not exists plan text
  check (plan is null or plan in ('showcase', 'lite', 'full'));
