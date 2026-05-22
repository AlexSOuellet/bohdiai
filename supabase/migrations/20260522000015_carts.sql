-- Carts and cart_items. Server-side persistence; anonymous (session_token) or
-- authenticated (customer_profile_id). Exactly one active cart per identifier.
-- Spec: project-docs/Tech-Arch-Spec.md §15

create table carts (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references tenants(id) on delete cascade,
  customer_profile_id   uuid references customer_profiles(id) on delete cascade,
  session_token         text,
  status                text not null default 'active' check (status in (
                          'active', 'converted', 'abandoned', 'expired'
                        )),
  currency              text not null default 'USD',
  applied_promo_id      uuid,
  applied_gift_card_id  uuid,
  notes_from_customer   text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  expires_at            timestamptz,
  converted_at          timestamptz,
  converted_order_id    uuid references orders(id) on delete set null,
  constraint carts_customer_or_session_check
    check (customer_profile_id is not null or session_token is not null)
);

create unique index carts_active_customer_unique
  on carts (customer_profile_id)
  where status = 'active' and customer_profile_id is not null;

create unique index carts_active_session_unique
  on carts (session_token)
  where status = 'active' and session_token is not null;

create index carts_tenant_status_idx on carts (tenant_id, status);
create index carts_abandoned_idx on carts (tenant_id, updated_at)
  where status = 'abandoned';

create trigger carts_set_updated_at
  before update on carts
  for each row execute function set_updated_at();

alter table carts enable row level security;

create table cart_items (
  id                  uuid primary key default gen_random_uuid(),
  cart_id             uuid not null references carts(id) on delete cascade,
  tenant_id           uuid not null references tenants(id) on delete cascade,
  listing_id          uuid not null references listings(id) on delete cascade,
  listing_variant_id  uuid references listing_variants(id) on delete cascade,
  quantity            integer not null check (quantity > 0),
  added_at            timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index cart_items_unique
  on cart_items (cart_id, listing_id, listing_variant_id);

create index cart_items_cart_idx on cart_items (cart_id);

create trigger cart_items_set_updated_at
  before update on cart_items
  for each row execute function set_updated_at();

alter table cart_items enable row level security;

comment on table carts is
  'Pre-checkout state. Anonymous (session_token) or authenticated (customer_profile_id). Spec: Tech-Arch-Spec.md §15.';
