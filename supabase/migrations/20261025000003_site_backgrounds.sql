-- A site's own background photo (Alex approved, Session 114, 2026-10-25). The maker's
-- own picture behind her pages (Renée's barn wood, from her pattern photo), shown by
-- the Rustic mood in place of its burlap. It is not Scenic's scene: Scenic keeps its
-- own home (site_scenes, a library scene or her photo) and its own real scenes, so
-- the two never stand in for each other.
--
-- It can't live in the page record (a maker's own photo is content).

create table if not exists site_backgrounds (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  upload_id uuid not null references uploads(id) on delete restrict,
  updated_at timestamptz not null default now()
);

create trigger site_backgrounds_set_updated_at
  before update on site_backgrounds
  for each row execute function set_updated_at();

alter table site_backgrounds enable row level security;

create policy site_backgrounds_admin_select on site_backgrounds
  for select to authenticated using (is_tenant_admin(tenant_id));
create policy site_backgrounds_admin_insert on site_backgrounds
  for insert to authenticated with check (is_tenant_admin(tenant_id));
create policy site_backgrounds_admin_update on site_backgrounds
  for update to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));
create policy site_backgrounds_admin_delete on site_backgrounds
  for delete to authenticated using (is_tenant_admin(tenant_id));

comment on table site_backgrounds is
  'A site''s own background photo behind its pages (the Rustic mood shows it in place of its wallpaper). Not Scenic''s scene (site_scenes).';
