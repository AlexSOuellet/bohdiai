-- The maker's own on/off switch for buyer accounts (Alex approved, Session 115,
-- 2026-10-26: "ONLY for full sites"). Buyer accounts are a Full feature; this is
-- her choice whether to use them. It starts on, so a Full shop shows sign-in
-- without her having to find the setting. Below Full, sign-in is closed whatever
-- this says, and her buyers' accounts are kept, so stepping down never changes it.
--
-- The buyers themselves already have homes: tenant_members (role 'customer'),
-- customer_profiles, and orders.customer_profile_id.

alter table public.tenants
  add column if not exists buyer_accounts_on boolean not null default true;

comment on column public.tenants.buyer_accounts_on is
  'The maker''s own switch for buyer accounts. Counts only on Full (the buyer_accounts feature); below Full sign-in is closed and accounts are kept.';
