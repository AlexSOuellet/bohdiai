-- Paying at sign-up (Alex, Session 119, 2026-10-31): every maker, Free included,
-- goes through Stripe's own checkout page when they make their account; Free is a
-- $0 subscription with no card box. The billing table (subscriptions, never used)
-- is where each site's Stripe subscription is kept.
--
-- 1. The billing table's plan names come from an early version (freemium, basic,
--    pro). It takes today's names instead, the same ones tenants.plan uses: free,
--    showcase, lite (shown as Market) and full.
-- 2. stripe_events: every notice Stripe sends us, by Stripe's own id. Stripe can
--    send the same notice more than once; a notice already here is not acted on
--    again, so one payment never builds a site or changes a plan twice.
--
-- Locked like square_connections: only BohdiAI's server reads or writes the
-- notices. No policy lets a maker's screen or the public site see a row.

alter table subscriptions drop constraint subscriptions_tier_check;
alter table subscriptions add constraint subscriptions_tier_check
  check (tier = any (array['free', 'showcase', 'lite', 'full']));

create table stripe_events (
  -- Stripe's id for the notice (evt_...).
  id text primary key check (length(id) between 1 and 255),
  -- What it was about, e.g. checkout.session.completed.
  type text not null check (length(type) between 1 and 255),
  received_at timestamptz not null default now()
);

alter table stripe_events enable row level security;
revoke all on stripe_events from public, anon, authenticated;
