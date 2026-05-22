-- Collections — how a tenant organizes listings. Many-to-many.
-- Spec: project-docs/Tech-Arch-Spec.md §12

create table collections (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references tenants(id) on delete cascade,
  slug               text not null,
  name               text not null,
  description        text,
  featured_image_id  uuid,
  is_featured        boolean not null default false,
  position           integer not null default 0,
  status             text not null default 'active' check (status in ('draft', 'active', 'archived')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);

create unique index collections_tenant_slug_unique
  on collections (tenant_id, lower(slug))
  where deleted_at is null;

create index collections_tenant_status_idx on collections (tenant_id, status) where deleted_at is null;
create index collections_tenant_featured_idx on collections (tenant_id, is_featured, position)
  where deleted_at is null and status = 'active';

create trigger collections_set_updated_at
  before update on collections
  for each row execute function set_updated_at();

alter table collections enable row level security;

create table listing_collections (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  listing_id     uuid not null references listings(id) on delete cascade,
  collection_id  uuid not null references collections(id) on delete cascade,
  position       integer not null default 0,
  created_at     timestamptz not null default now()
);

create unique index listing_collections_unique
  on listing_collections (listing_id, collection_id);

create index listing_collections_collection_position_idx
  on listing_collections (collection_id, position);

create index listing_collections_listing_idx on listing_collections (listing_id);

alter table listing_collections enable row level security;

comment on table collections is
  'Tenant-defined groupings of listings. Many-to-many via listing_collections. Spec: Tech-Arch-Spec.md §12.';
