-- Listings — unified table for everything a tenant offers (products, digital,
-- services, classes, events, appointments). Per D3.
-- The listing_type check constraint is named explicitly so later migrations
-- (e.g. gift_cards adding 'gift_card') can ALTER it by name.
-- Spec: project-docs/Tech-Arch-Spec.md §10

create table listings (
  id                     uuid primary key default gen_random_uuid(),
  tenant_id              uuid not null references tenants(id) on delete cascade,
  listing_type           text not null,
  slug                   text not null,
  name                   text not null,
  short_description      text,
  description            text,
  base_price_cents       integer not null check (base_price_cents >= 0),
  currency               text not null default 'USD',
  status                 text not null default 'draft' check (status in (
                           'draft', 'active', 'sold_out', 'archived', 'unavailable'
                         )),
  inventory_tracked      boolean not null default false,
  inventory_count        integer check (inventory_count is null or inventory_count >= 0),
  low_stock_threshold    integer,
  requires_shipping      boolean not null default true,
  requires_scheduling    boolean not null default false,
  weight_grams           integer,
  dimensions             jsonb,
  media_ids              uuid[] not null default '{}',
  post_purchase_note     text,
  primary_collection_id  uuid,
  payment_model          text not null default 'one_time' check (payment_model in (
                           'one_time', 'subscription', 'deposit', 'quote'
                         )),
  subscription_interval  text check (subscription_interval is null or subscription_interval in ('week', 'month', 'year')),
  metadata               jsonb not null default '{}'::jsonb,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  published_at           timestamptz,
  deleted_at             timestamptz,
  constraint listings_listing_type_check check (listing_type in (
    'product', 'digital_product', 'service', 'class', 'event', 'appointment'
  ))
);

create unique index listings_tenant_slug_unique
  on listings (tenant_id, lower(slug))
  where deleted_at is null;

create index listings_tenant_status_idx on listings (tenant_id, status) where deleted_at is null;
create index listings_tenant_type_idx on listings (tenant_id, listing_type) where deleted_at is null;
create index listings_tenant_published_idx on listings (tenant_id, published_at desc)
  where status = 'active' and deleted_at is null;

create trigger listings_set_updated_at
  before update on listings
  for each row execute function set_updated_at();

alter table listings enable row level security;

comment on table listings is
  'Unified catalog: products, digital, services, classes, events, appointments. Spec: Tech-Arch-Spec.md §10.';
