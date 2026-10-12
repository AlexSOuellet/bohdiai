-- Plan credit (Saltmarsh & Lace demo spec, stage two; Alex chose this 2026-10-09):
-- when a yearly site moves up to monthly, the unused part of its year is kept as
-- credit that pays its next bills until it runs out. Nothing is refunded.
alter table public.tenants
  add column if not exists plan_credit_cents integer not null default 0 check (plan_credit_cents >= 0);
