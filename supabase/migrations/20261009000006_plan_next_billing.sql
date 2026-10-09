-- A downgrade waits for renewal and lets her pick how the new plan is billed from
-- then on (Saltmarsh & Lace demo spec, stage two).
alter table public.tenants
  add column if not exists plan_next_billing text check (plan_next_billing is null or plan_next_billing in ('monthly', 'yearly'));
