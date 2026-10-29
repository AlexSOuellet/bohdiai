-- The description writer (Alex approved, 2026-10-28): one row each time a site has
-- its description written, so the month's runs can be counted against the plan's
-- limit (30 on Free, 100 on the paid plans). Only the site and when: no words, no photos.
-- The owner can read their own count; only the server adds rows.
create table description_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index description_runs_tenant_month on description_runs (tenant_id, created_at);

alter table description_runs enable row level security;
create policy description_runs_admin_select on description_runs for select to authenticated using (is_tenant_admin(tenant_id));

comment on table description_runs is 'One row per description written, counted against the month''s limit. Spec: Project-Docs/Plan-Backends.md ("The tools").';
