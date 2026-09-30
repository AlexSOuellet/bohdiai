-- Per-site feature switches (Maker Backend piece 1). Alex controls which features a
-- site has; later a plan/tier flips the same rows. A site with no row for a key gets
-- the key's default from lib/backend/features.ts.
create table if not exists tenant_features (
  tenant_id uuid not null references tenants(id) on delete cascade,
  feature_key text not null check (feature_key ~ '^[a-z][a-z0-9_]*$'),
  enabled boolean not null,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, feature_key)
);

create trigger tenant_features_set_updated_at
  before update on tenant_features
  for each row execute function set_updated_at();

alter table tenant_features enable row level security;

-- A site's admins may read their own switches. Nobody writes through the API:
-- only the service role (scripts, later Alex's admin and billing) changes them.
create policy tenant_features_admin_read on tenant_features
  for select to authenticated
  using (is_tenant_admin(tenant_id));

comment on table tenant_features is
  'Per-site feature switches. Absent row = the key''s code default. Written only by the service role. Spec: docs/superpowers/specs/2026-09-30-maker-backend-piece-1-design.md §2.';
