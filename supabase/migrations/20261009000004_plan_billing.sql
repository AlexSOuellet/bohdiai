-- How a site's plan is billed (Saltmarsh & Lace demo spec, stage two): monthly or
-- yearly, the next renewal day, and a move down waiting for that renewal. Upgrades
-- are prorated against the period already paid; moves down take effect at renewal
-- (no refunds). Null for sites with no plan.
alter table public.tenants
  add column if not exists plan_billing text check (plan_billing is null or plan_billing in ('monthly', 'yearly')),
  add column if not exists plan_renews_on date,
  add column if not exists plan_next text check (plan_next is null or plan_next in ('showcase', 'lite', 'full'));
