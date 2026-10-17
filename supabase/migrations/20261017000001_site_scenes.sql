-- The photo behind a Scenic site (Alex approved, Session 107, 2026-10-17).
-- Scenic is the one family with a photo locked behind the page and the content
-- floating over it. Each Scenic site has one row here, holding exactly one of:
--   scene_key        a scene from the library (platform photos kept with the
--                    design files, listed in code: lib/archetypes/main-street/scenes.ts)
--   upload_id        the maker's own photo, as a normal upload
-- Never both, never neither. Other families have no row.
--
-- It is not the moment and not About you: it is what sits behind the page. It
-- can't live in the page record (a maker's own photo is content).

create table if not exists site_scenes (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  scene_key text check (scene_key is null or scene_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  upload_id uuid references uploads(id) on delete restrict,
  updated_at timestamptz not null default now(),
  constraint site_scenes_one_photo check ((scene_key is null) <> (upload_id is null))
);

create trigger site_scenes_set_updated_at
  before update on site_scenes
  for each row execute function set_updated_at();

alter table site_scenes enable row level security;

create policy site_scenes_admin_select on site_scenes
  for select to authenticated using (is_tenant_admin(tenant_id));
create policy site_scenes_admin_insert on site_scenes
  for insert to authenticated with check (is_tenant_admin(tenant_id));
create policy site_scenes_admin_update on site_scenes
  for update to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));
create policy site_scenes_admin_delete on site_scenes
  for delete to authenticated using (is_tenant_admin(tenant_id));

comment on table site_scenes is
  'The photo behind a Scenic site: a library scene (scene_key) or the maker''s own upload (upload_id), exactly one. Spec: Project-Docs/Modular-Plan.md, The lineup.';
