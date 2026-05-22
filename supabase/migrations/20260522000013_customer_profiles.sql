-- Customer profiles — extra data for tenant_members with role='customer'.
-- Per-tenant isolation: same person at three stores = three profile rows.
-- Spec: project-docs/Tech-Arch-Spec.md §13

create table customer_profiles (
  id                 uuid primary key default gen_random_uuid(),
  tenant_member_id   uuid not null references tenant_members(id) on delete cascade,
  tenant_id          uuid not null references tenants(id) on delete cascade,
  user_id            uuid not null references auth.users(id) on delete cascade,
  display_name       text,
  phone              text,
  marketing_opt_in   boolean not null default false,
  notes_for_maker    text,
  total_orders       integer not null default 0,
  total_spent_cents  bigint not null default 0,
  first_order_at     timestamptz,
  last_order_at      timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create unique index customer_profiles_tenant_member_unique
  on customer_profiles (tenant_member_id);

create index customer_profiles_tenant_idx on customer_profiles (tenant_id);
create index customer_profiles_tenant_recent_idx
  on customer_profiles (tenant_id, last_order_at desc nulls last);

create trigger customer_profiles_set_updated_at
  before update on customer_profiles
  for each row execute function set_updated_at();

alter table customer_profiles enable row level security;

create table customer_addresses (
  id                   uuid primary key default gen_random_uuid(),
  customer_profile_id  uuid not null references customer_profiles(id) on delete cascade,
  tenant_id            uuid not null references tenants(id) on delete cascade,
  label                text,
  recipient_name       text not null,
  line1                text not null,
  line2                text,
  city                 text not null,
  state                text,
  postal_code          text not null,
  country              text not null default 'US',
  phone                text,
  is_default_shipping  boolean not null default false,
  is_default_billing   boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

create index customer_addresses_profile_idx on customer_addresses (customer_profile_id)
  where deleted_at is null;

create unique index customer_addresses_default_shipping_unique
  on customer_addresses (customer_profile_id)
  where is_default_shipping = true and deleted_at is null;

create unique index customer_addresses_default_billing_unique
  on customer_addresses (customer_profile_id)
  where is_default_billing = true and deleted_at is null;

create trigger customer_addresses_set_updated_at
  before update on customer_addresses
  for each row execute function set_updated_at();

alter table customer_addresses enable row level security;

create table wishlist_items (
  id                   uuid primary key default gen_random_uuid(),
  customer_profile_id  uuid not null references customer_profiles(id) on delete cascade,
  tenant_id            uuid not null references tenants(id) on delete cascade,
  listing_id           uuid not null references listings(id) on delete cascade,
  created_at           timestamptz not null default now()
);

create unique index wishlist_items_unique on wishlist_items (customer_profile_id, listing_id);
create index wishlist_items_listing_idx on wishlist_items (listing_id);

alter table wishlist_items enable row level security;

comment on table customer_profiles is
  'Per-tenant customer extras: name, phone, opt-in, cached order aggregates. Spec: Tech-Arch-Spec.md §13.';
