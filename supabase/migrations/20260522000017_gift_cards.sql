-- Gift cards — stored-value instruments with transaction history.
-- Also adds 'gift_card' to listings.listing_type so a tenant can sell them
-- as a listing (per spec §17 — "Required change to listings").
-- Spec: project-docs/Tech-Arch-Spec.md §17

alter table listings drop constraint listings_listing_type_check;
alter table listings add constraint listings_listing_type_check
  check (listing_type in (
    'product', 'digital_product', 'service',
    'class', 'event', 'appointment', 'gift_card'
  ));

create table gift_cards (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references tenants(id) on delete cascade,
  code                     text not null,
  initial_value_cents      integer not null check (initial_value_cents > 0),
  current_balance_cents    integer not null check (current_balance_cents >= 0),
  currency                 text not null default 'USD',
  purchased_by_profile_id  uuid references customer_profiles(id) on delete set null,
  purchased_by_order_id    uuid references orders(id) on delete set null,
  recipient_email          text,
  recipient_name           text,
  sender_name              text,
  message                  text,
  delivery_status          text not null default 'pending' check (delivery_status in (
                             'pending', 'scheduled', 'delivered', 'failed'
                           )),
  scheduled_delivery_at    timestamptz,
  delivered_at             timestamptz,
  status                   text not null default 'active' check (status in (
                             'active', 'depleted', 'expired', 'canceled'
                           )),
  expires_at               timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create unique index gift_cards_tenant_code_unique
  on gift_cards (tenant_id, code);

create index gift_cards_tenant_status_idx on gift_cards (tenant_id, status);
create index gift_cards_recipient_email_idx on gift_cards (lower(recipient_email))
  where recipient_email is not null;

create trigger gift_cards_set_updated_at
  before update on gift_cards
  for each row execute function set_updated_at();

alter table gift_cards enable row level security;

create table gift_card_transactions (
  id                   uuid primary key default gen_random_uuid(),
  gift_card_id         uuid not null references gift_cards(id) on delete cascade,
  tenant_id            uuid not null references tenants(id) on delete cascade,
  order_id             uuid references orders(id) on delete set null,
  transaction_type     text not null check (transaction_type in (
                         'issue', 'redeem', 'refund', 'adjustment', 'expire'
                       )),
  amount_cents         integer not null,
  balance_after_cents  integer not null check (balance_after_cents >= 0),
  note                 text,
  created_at           timestamptz not null default now()
);

create index gift_card_transactions_card_idx
  on gift_card_transactions (gift_card_id, created_at desc);

create index gift_card_transactions_order_idx
  on gift_card_transactions (order_id) where order_id is not null;

alter table gift_card_transactions enable row level security;

comment on table gift_cards is
  'Stored-value gift cards. Issued via listing purchase; redeemed at checkout. Spec: Tech-Arch-Spec.md §17.';
