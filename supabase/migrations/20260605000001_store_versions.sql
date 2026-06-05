-- Store versions — saved try-on variants of a tenant's store. The live store
-- stays in content_pages; a version is a self-contained archetype envelope
-- (content + products + look) previewed in place via ?v=<label>. RLS on with no
-- policies: service-role (admin client) only, same as builds.
create table store_versions (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  label       text not null,
  -- { kind:'archetype', archetypeKey, lookKey, mood, catalogSize, content, products }
  envelope    jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, label),
  constraint store_versions_envelope_is_object check (jsonb_typeof(envelope) = 'object')
);

create index store_versions_tenant_idx on store_versions (tenant_id, created_at desc);

create trigger store_versions_set_updated_at
  before update on store_versions
  for each row execute function set_updated_at();

alter table store_versions enable row level security;

comment on table store_versions is
  'Saved try-on variants of a store. Self-contained archetype envelopes previewed via ?v=<label>; the live store stays in content_pages.';
