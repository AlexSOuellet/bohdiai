-- Promos and promo_redemptions. Type discriminator plus JSONB rules for flexibility.
-- Spec: project-docs/Tech-Arch-Spec.md §19

create table promos (
  id                     uuid primary key default gen_random_uuid(),
  tenant_id              uuid not null references tenants(id) on delete cascade,
  code                   text,
  internal_name          text not null,
  description            text,
  promo_type             text not null check (promo_type in (
                           'discount_code', 'automatic', 'bundle', 'sale'
                         )),
  discount_type          text not null check (discount_type in (
                           'percent_off', 'fixed_amount_off', 'free_shipping',
                           'buy_x_get_y', 'fixed_bundle_price'
                         )),
  discount_value_cents   integer,
  discount_percent       numeric(5,2),
  applies_to             jsonb not null default '{"scope": "all"}'::jsonb,
  conditions             jsonb not null default '{}'::jsonb,
  max_uses_total         integer,
  max_uses_per_customer  integer,
  uses_count             integer not null default 0,
  starts_at              timestamptz,
  ends_at                timestamptz,
  status                 text not null default 'active' check (status in (
                           'draft', 'scheduled', 'active', 'paused',
                           'expired', 'depleted'
                         )),
  stackable_with_others  boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create unique index promos_tenant_code_unique
  on promos (tenant_id, lower(code))
  where code is not null;

create index promos_tenant_status_idx on promos (tenant_id, status);
create index promos_tenant_active_window_idx
  on promos (tenant_id, starts_at, ends_at)
  where status in ('active', 'scheduled');

create trigger promos_set_updated_at
  before update on promos
  for each row execute function set_updated_at();

alter table promos enable row level security;

create table promo_redemptions (
  id                       uuid primary key default gen_random_uuid(),
  promo_id                 uuid not null references promos(id) on delete cascade,
  tenant_id                uuid not null references tenants(id) on delete cascade,
  order_id                 uuid not null references orders(id) on delete cascade,
  customer_profile_id      uuid references customer_profiles(id) on delete set null,
  amount_discounted_cents  integer not null check (amount_discounted_cents >= 0),
  created_at               timestamptz not null default now()
);

create index promo_redemptions_promo_idx on promo_redemptions (promo_id);
create index promo_redemptions_order_idx on promo_redemptions (order_id);
create index promo_redemptions_customer_idx
  on promo_redemptions (customer_profile_id) where customer_profile_id is not null;

alter table promo_redemptions enable row level security;

comment on table promos is
  'Discount codes, automatic promos, bundles, sales. Type + JSONB rules for flexibility. Spec: Tech-Arch-Spec.md §19.';
