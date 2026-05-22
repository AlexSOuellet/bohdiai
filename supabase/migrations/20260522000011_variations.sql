-- Variations — seller-defined attributes, options, and orderable variants per D4.
-- Three tables: attributes (scent, size), options (vanilla, 16oz), variants (SKUs).
-- Spec: project-docs/Tech-Arch-Spec.md §11

create table variation_attributes (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  listing_id  uuid not null references listings(id) on delete cascade,
  name        text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index variation_attributes_listing_name_unique
  on variation_attributes (listing_id, lower(name));

create index variation_attributes_listing_position_idx
  on variation_attributes (listing_id, position);

create trigger variation_attributes_set_updated_at
  before update on variation_attributes
  for each row execute function set_updated_at();

alter table variation_attributes enable row level security;

create table variation_options (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  attribute_id  uuid not null references variation_attributes(id) on delete cascade,
  value         text not null,
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index variation_options_attribute_value_unique
  on variation_options (attribute_id, lower(value));

create index variation_options_attribute_position_idx
  on variation_options (attribute_id, position);

create trigger variation_options_set_updated_at
  before update on variation_options
  for each row execute function set_updated_at();

alter table variation_options enable row level security;

create table listing_variants (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenants(id) on delete cascade,
  listing_id          uuid not null references listings(id) on delete cascade,
  sku                 text,
  option_combination  jsonb not null,
  price_cents         integer check (price_cents is null or price_cents >= 0),
  inventory_count     integer check (inventory_count is null or inventory_count >= 0),
  media_ids           uuid[] not null default '{}',
  status              text not null default 'active' check (status in ('active', 'sold_out', 'archived')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint listing_variants_combination_is_object check (jsonb_typeof(option_combination) = 'object')
);

create unique index listing_variants_combination_unique
  on listing_variants (listing_id, option_combination);

create unique index listing_variants_sku_unique
  on listing_variants (tenant_id, lower(sku))
  where sku is not null;

create index listing_variants_listing_status_idx on listing_variants (listing_id, status);

create trigger listing_variants_set_updated_at
  before update on listing_variants
  for each row execute function set_updated_at();

alter table listing_variants enable row level security;

comment on table listing_variants is
  'Orderable SKU per option combination. Inherits price/inventory from listing when null. Spec: Tech-Arch-Spec.md §11.';
