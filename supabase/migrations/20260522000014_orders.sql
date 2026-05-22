-- Orders, order_items, payments, shipments, shipment_items.
-- Snapshots on order_items so listing edits/deletes don't corrupt history.
-- Multi-shipment supported from day one per D12.
-- Spec: project-docs/Tech-Arch-Spec.md §14

create table orders (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid not null references tenants(id) on delete cascade,
  order_number         text not null,
  customer_profile_id  uuid references customer_profiles(id) on delete set null,
  customer_email       text not null,
  customer_name        text not null,
  customer_phone       text,
  status               text not null default 'pending' check (status in (
                         'pending', 'paid', 'fulfilled', 'shipped',
                         'delivered', 'canceled', 'refunded', 'partially_refunded'
                       )),
  subtotal_cents       integer not null check (subtotal_cents >= 0),
  tax_cents            integer not null default 0 check (tax_cents >= 0),
  shipping_cents       integer not null default 0 check (shipping_cents >= 0),
  discount_cents       integer not null default 0 check (discount_cents >= 0),
  total_cents          integer not null check (total_cents >= 0),
  currency             text not null default 'USD',
  shipping_address     jsonb,
  billing_address      jsonb,
  notes_to_customer    text,
  internal_notes       text,
  source               text not null default 'storefront' check (source in (
                         'storefront', 'market_mode', 'admin_manual', 'imported'
                       )),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  paid_at              timestamptz,
  fulfilled_at         timestamptz,
  canceled_at          timestamptz
);

create unique index orders_tenant_number_unique on orders (tenant_id, order_number);
create index orders_tenant_status_idx on orders (tenant_id, status);
create index orders_tenant_created_idx on orders (tenant_id, created_at desc);
create index orders_customer_idx on orders (customer_profile_id) where customer_profile_id is not null;

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

alter table orders enable row level security;

create table order_items (
  id                            uuid primary key default gen_random_uuid(),
  order_id                      uuid not null references orders(id) on delete cascade,
  tenant_id                     uuid not null references tenants(id) on delete cascade,
  listing_id                    uuid references listings(id) on delete set null,
  listing_variant_id            uuid references listing_variants(id) on delete set null,
  name_snapshot                 text not null,
  variant_description_snapshot  text,
  unit_price_cents              integer not null check (unit_price_cents >= 0),
  quantity                      integer not null check (quantity > 0),
  subtotal_cents                integer not null check (subtotal_cents >= 0),
  post_purchase_note_snapshot   text,
  metadata                      jsonb not null default '{}'::jsonb,
  created_at                    timestamptz not null default now()
);

create index order_items_order_idx on order_items (order_id);
create index order_items_listing_idx on order_items (listing_id) where listing_id is not null;

alter table order_items enable row level security;

create table payments (
  id                   uuid primary key default gen_random_uuid(),
  order_id             uuid not null references orders(id) on delete cascade,
  tenant_id            uuid not null references tenants(id) on delete cascade,
  processor            text not null check (processor in ('stripe', 'square', 'manual')),
  external_payment_id  text,
  payment_type         text not null check (payment_type in ('charge', 'refund', 'partial_refund')),
  status               text not null check (status in ('pending', 'succeeded', 'failed')),
  amount_cents         integer not null,
  currency             text not null default 'USD',
  payment_method_type  text,
  failure_reason       text,
  metadata             jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  processed_at         timestamptz
);

create index payments_order_idx on payments (order_id);
create unique index payments_external_id_unique
  on payments (processor, external_payment_id)
  where external_payment_id is not null;

create trigger payments_set_updated_at
  before update on payments
  for each row execute function set_updated_at();

alter table payments enable row level security;

create table shipments (
  id                     uuid primary key default gen_random_uuid(),
  tenant_id              uuid not null references tenants(id) on delete cascade,
  order_id               uuid not null references orders(id) on delete cascade,
  shipment_number        integer not null,
  carrier                text,
  shipping_method        text,
  tracking_number        text,
  tracking_url           text,
  status                 text not null default 'pending' check (status in (
                           'pending', 'label_purchased', 'shipped',
                           'in_transit', 'delivered', 'returned', 'lost'
                         )),
  shipped_at             timestamptz,
  estimated_delivery_at  timestamptz,
  delivered_at           timestamptz,
  notes                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create unique index shipments_order_number_unique
  on shipments (order_id, shipment_number);

create index shipments_tenant_status_idx on shipments (tenant_id, status);
create index shipments_order_idx on shipments (order_id);
create index shipments_tracking_idx on shipments (lower(tracking_number))
  where tracking_number is not null;

create trigger shipments_set_updated_at
  before update on shipments
  for each row execute function set_updated_at();

alter table shipments enable row level security;

create table shipment_items (
  id             uuid primary key default gen_random_uuid(),
  shipment_id    uuid not null references shipments(id) on delete cascade,
  tenant_id      uuid not null references tenants(id) on delete cascade,
  order_item_id  uuid not null references order_items(id) on delete cascade,
  quantity       integer not null check (quantity > 0),
  created_at     timestamptz not null default now()
);

create unique index shipment_items_unique
  on shipment_items (shipment_id, order_item_id);

create index shipment_items_order_item_idx on shipment_items (order_item_id);

alter table shipment_items enable row level security;

comment on table orders is
  'Top-level transaction. Status lifecycle pending → paid → fulfilled → shipped → delivered. Spec: Tech-Arch-Spec.md §14.';
