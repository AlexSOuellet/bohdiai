-- Tenant members — bridge between Supabase auth.users and tenants.
-- One row per (user, tenant) relationship with a role.
-- Spec: project-docs/Tech-Arch-Spec.md §2

create table tenant_members (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  role        text not null check (role in ('admin', 'customer')),
  status      text not null default 'active' check (status in ('active', 'removed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  removed_at  timestamptz
);

create unique index tenant_members_user_tenant_unique
  on tenant_members (user_id, tenant_id)
  where status = 'active';

create index tenant_members_tenant_role_idx
  on tenant_members (tenant_id, role)
  where status = 'active';

create index tenant_members_user_idx
  on tenant_members (user_id)
  where status = 'active';

create trigger tenant_members_set_updated_at
  before update on tenant_members
  for each row
  execute function set_updated_at();

alter table tenant_members enable row level security;

comment on table tenant_members is
  'Bridge from auth.users to tenants. One row per (user, tenant) membership with role. Spec: Tech-Arch-Spec.md §2.';
