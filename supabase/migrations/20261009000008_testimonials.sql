-- Testimonials (Full; Saltmarsh & Lace demo spec): what her customers say, in her
-- order. The home page shows a few with "See more"; /testimonials shows them all.
-- The storefront reads with the service role; the owner manages them in the backend.
create table if not exists site_testimonials (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  quote text not null check (char_length(quote) between 1 and 600),
  name text not null check (char_length(name) between 1 and 60),
  detail text check (detail is null or char_length(detail) between 1 and 60),
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_testimonials_tenant_position on site_testimonials (tenant_id, position);

create trigger site_testimonials_set_updated_at
  before update on site_testimonials
  for each row execute function set_updated_at();

alter table site_testimonials enable row level security;

create policy site_testimonials_admin_select on site_testimonials
  for select to authenticated using (is_tenant_admin(tenant_id));
create policy site_testimonials_admin_insert on site_testimonials
  for insert to authenticated with check (is_tenant_admin(tenant_id));
create policy site_testimonials_admin_update on site_testimonials
  for update to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));
create policy site_testimonials_admin_delete on site_testimonials
  for delete to authenticated using (is_tenant_admin(tenant_id));

comment on table site_testimonials is
  'What a site''s customers say, in the owner''s order (Full). The storefront reads with the service role. Spec: docs/superpowers/specs/2026-10-09-saltmarsh-demo-design.md.';
