-- Reviews — verified-purchase, one per order_item.
-- Spec: project-docs/Tech-Arch-Spec.md §16

create table reviews (
  id                      uuid primary key default gen_random_uuid(),
  tenant_id               uuid not null references tenants(id) on delete cascade,
  listing_id              uuid not null references listings(id) on delete cascade,
  order_id                uuid not null references orders(id) on delete cascade,
  order_item_id           uuid not null references order_items(id) on delete cascade,
  customer_profile_id     uuid references customer_profiles(id) on delete set null,
  reviewer_name_snapshot  text not null,
  rating                  integer not null check (rating between 1 and 5),
  title                   text,
  body                    text,
  media_ids               uuid[] not null default '{}',
  status                  text not null default 'published' check (status in (
                            'pending', 'published', 'hidden', 'flagged', 'removed'
                          )),
  maker_response          text,
  maker_responded_at      timestamptz,
  helpful_count           integer not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create unique index reviews_one_per_order_item on reviews (order_item_id);
create index reviews_listing_status_idx on reviews (listing_id, status, created_at desc);
create index reviews_tenant_status_idx on reviews (tenant_id, status);
create index reviews_customer_idx on reviews (customer_profile_id) where customer_profile_id is not null;

create trigger reviews_set_updated_at
  before update on reviews
  for each row execute function set_updated_at();

alter table reviews enable row level security;

comment on table reviews is
  'Verified-purchase reviews tied to order_items. One review per order_item. Spec: Tech-Arch-Spec.md §16.';
