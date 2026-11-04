-- Promotions (Alex, 2026-11-04): discounts for makers, by code or given directly.
--
-- 1. subscriptions: what the maker really pays. Stripe holds the discount itself;
--    these three say what's running, so the admin's MRR is true and a maker can't
--    stack a second discount on one that hasn't ended.
-- 2. plan_promo_uses: who used which plan code (promo_redemptions is the shops' own, for buyers). A maker uses a code once, ever: the
--    email is kept as well as the site, so cancelling and signing up again doesn't
--    earn the code back. Stripe's own limit counts a code's total uses, not uses
--    per maker.
--
-- Locked like stripe_events: only BohdiAI's server reads or writes redemptions.

alter table subscriptions add column discount_label text check (char_length(discount_label) <= 120);
alter table subscriptions add column discount_percent int check (discount_percent between 0 and 100);
alter table subscriptions add column discount_ends_at timestamptz;

comment on column subscriptions.discount_label is
  'The discount running, as Alex and the maker read it ("3 months free"); null is none.';
comment on column subscriptions.discount_percent is
  'Percent off each bill while it runs. 0 when it was given as credit toward a yearly renewal.';
comment on column subscriptions.discount_ends_at is
  'When the discount stops; null runs for as long as the subscription does.';

create table plan_promo_uses (
  id uuid primary key default gen_random_uuid(),
  -- The code as Stripe holds it (the coupon's id).
  code text not null check (char_length(code) between 1 and 40),
  tenant_id uuid not null references tenants (id) on delete cascade,
  email text not null check (char_length(email) between 3 and 320),
  redeemed_at timestamptz not null default now(),
  unique (code, tenant_id),
  unique (code, email)
);

alter table plan_promo_uses enable row level security;
revoke all on plan_promo_uses from public, anon, authenticated;
