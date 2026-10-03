-- Business card site (spec 2026-10-03-business-card-site-design.md).
-- 1. Gallery — the shared photo feature from the backend overview, built once here.
create table if not exists gallery_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  upload_id uuid not null references uploads(id) on delete restrict,
  caption text check (caption is null or char_length(caption) between 1 and 80),
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gallery_items_tenant_position on gallery_items (tenant_id, position);

create trigger gallery_items_set_updated_at
  before update on gallery_items
  for each row execute function set_updated_at();

alter table gallery_items enable row level security;

create policy gallery_items_admin_select on gallery_items
  for select to authenticated using (is_tenant_admin(tenant_id));
create policy gallery_items_admin_insert on gallery_items
  for insert to authenticated with check (is_tenant_admin(tenant_id));
create policy gallery_items_admin_update on gallery_items
  for update to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));
create policy gallery_items_admin_delete on gallery_items
  for delete to authenticated using (is_tenant_admin(tenant_id));

comment on table gallery_items is
  'A site''s gallery photos in the owner''s order. The storefront reads with the service role. Spec: docs/superpowers/specs/2026-10-03-business-card-site-design.md.';

-- 2. Profile — the words and contact details the owner manages on a card site.
create table if not exists site_profiles (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  kicker text check (kicker is null or char_length(kicker) between 1 and 60),
  headline text check (headline is null or char_length(headline) between 1 and 160),
  about_title text check (about_title is null or char_length(about_title) between 1 and 80),
  bio text check (bio is null or char_length(bio) between 1 and 1500),
  signature text check (signature is null or char_length(signature) between 1 and 40),
  phone text check (phone is null or char_length(phone) between 7 and 25),
  facebook_url text check (facebook_url is null or facebook_url ~ '^https://([a-z0-9-]+\.)*facebook\.com/'),
  instagram_url text check (instagram_url is null or instagram_url ~ '^https://([a-z0-9-]+\.)*instagram\.com/'),
  updated_at timestamptz not null default now()
);

create trigger site_profiles_set_updated_at
  before update on site_profiles
  for each row execute function set_updated_at();

alter table site_profiles enable row level security;

create policy site_profiles_admin_select on site_profiles
  for select to authenticated using (is_tenant_admin(tenant_id));
create policy site_profiles_admin_insert on site_profiles
  for insert to authenticated with check (is_tenant_admin(tenant_id));
create policy site_profiles_admin_update on site_profiles
  for update to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));

comment on table site_profiles is
  'The owner-edited words and contact details of a card site. The storefront reads with the service role. Spec: docs/superpowers/specs/2026-10-03-business-card-site-design.md.';
