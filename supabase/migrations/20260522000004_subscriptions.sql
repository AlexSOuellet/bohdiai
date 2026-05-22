-- Subscriptions — billing relationship between BohdiAI and the tenant.
-- One row per subscription period; tier changes create new rows (history is the table).
-- Spec: project-docs/Tech-Arch-Spec.md §3

create table subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  tenant_id               uuid not null references tenants(id) on delete cascade,
  tier                    text not null check (tier in ('freemium', 'basic', 'pro')),
  status                  text not null check (status in (
                            'trialing', 'active', 'past_due', 'canceled',
                            'incomplete', 'incomplete_expired', 'unpaid', 'paused'
                          )),
  stripe_customer_id      text,
  stripe_subscription_id  text,
  stripe_price_id         text,
  billing_interval        text check (billing_interval in ('month', 'year')),
  unit_amount_cents       integer,
  currency                text default 'USD',
  trial_start             timestamptz,
  trial_end               timestamptz,
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  canceled_at             timestamptz,
  ended_at                timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create unique index subscriptions_tenant_active_unique
  on subscriptions (tenant_id)
  where ended_at is null;

create unique index subscriptions_stripe_subscription_unique
  on subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

create index subscriptions_tenant_history_idx
  on subscriptions (tenant_id, created_at desc);

create index subscriptions_status_idx
  on subscriptions (status)
  where ended_at is null;

create index subscriptions_period_end_idx
  on subscriptions (current_period_end)
  where ended_at is null and status in ('active', 'trialing');

create trigger subscriptions_set_updated_at
  before update on subscriptions
  for each row
  execute function set_updated_at();

alter table subscriptions enable row level security;

comment on table subscriptions is
  'Billing relationship to BohdiAI. One row per subscription period; tier changes append new rows. Spec: Tech-Arch-Spec.md §3.';
