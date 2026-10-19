-- About you holds only what's in the About section (Alex, 2026-10-19; Project-Docs/
-- Plan-Backends.md). Everything else moves to its own home, each with its own
-- backend screen; nothing is left in two places.
--
-- 1. tenants.plan_cancels: the site cancels at the end of its current term.
-- 2. site_marquees: the scrolling line's phrases (moved from site_profiles).
-- 3. site_contacts: contact information, the phone (moved from site_profiles).
-- 4. site_socials: one row per social account (moved from site_profiles).
-- 5. The about heading lives in the section words (site_sections 'about'), where
--    every family design already reads it; site_profiles.about_title goes.
-- 6. support_messages: a copy of every Contact support message, for Alex's admin.

-- 1. Cancel at the end of the term.
alter table tenants add column plan_cancels boolean not null default false;

-- 2. The scrolling line.
create table site_marquees (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  phrases text[] not null check (cardinality(phrases) between 1 and 12),
  updated_at timestamptz not null default now()
);
alter table site_marquees add constraint site_marquees_phrase_length check (site_marquee_phrases_ok(phrases));
insert into site_marquees (tenant_id, phrases)
  select tenant_id, marquee_phrases from site_profiles where marquee_phrases is not null;
alter table site_profiles drop constraint site_profiles_marquee_phrase_length;
alter table site_profiles drop column marquee_phrases;

-- 3. Contact information.
create table site_contacts (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  phone text check (phone is null or char_length(phone) between 7 and 25),
  updated_at timestamptz not null default now()
);
insert into site_contacts (tenant_id, phone)
  select tenant_id, phone from site_profiles where phone is not null;
alter table site_profiles drop column phone;

-- 4. Socials: one row per account, in the owner's order.
create table site_socials (
  tenant_id uuid not null references tenants(id) on delete cascade,
  network text not null check (network in ('facebook', 'instagram')),
  url text not null check (
    (network = 'facebook' and url ~ '^https://([a-z0-9-]+\.)*facebook\.com/')
    or (network = 'instagram' and url ~ '^https://([a-z0-9-]+\.)*instagram\.com/')
  ),
  position integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, network)
);
insert into site_socials (tenant_id, network, url, position)
  select tenant_id, 'facebook', facebook_url, 0 from site_profiles where facebook_url is not null;
insert into site_socials (tenant_id, network, url, position)
  select tenant_id, 'instagram', instagram_url, 1 from site_profiles where instagram_url is not null;
alter table site_profiles drop column facebook_url;
alter table site_profiles drop column instagram_url;

-- 5. The about heading: one home, the section words. A site's existing section
--    heading wins; otherwise its About-you heading moves in.
insert into site_sections (tenant_id, section, title)
  select tenant_id, 'about', about_title from site_profiles where about_title is not null
  on conflict (tenant_id, section) do update set title = coalesce(site_sections.title, excluded.title);
alter table site_profiles drop column about_title;

-- 6. Contact support copies (Alex's admin reads them with the service role; owners
--    send through the backend, which writes with the service role too).
create table support_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null,
  email text not null,
  message text not null check (char_length(message) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index support_messages_created on support_messages (created_at desc);
alter table support_messages enable row level security;

-- Owners manage their own homes (the storefront reads with the service role).
do $$
declare t text;
begin
  foreach t in array array['site_marquees', 'site_contacts', 'site_socials'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create trigger %I before update on %I for each row execute function set_updated_at()', t || '_set_updated_at', t);
    execute format('create policy %I on %I for select to authenticated using (is_tenant_admin(tenant_id))', t || '_admin_select', t);
    execute format('create policy %I on %I for insert to authenticated with check (is_tenant_admin(tenant_id))', t || '_admin_insert', t);
    execute format('create policy %I on %I for update to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id))', t || '_admin_update', t);
    execute format('create policy %I on %I for delete to authenticated using (is_tenant_admin(tenant_id))', t || '_admin_delete', t);
  end loop;
end $$;

comment on table site_marquees is 'The scrolling line''s phrases for one site. Spec: Project-Docs/Plan-Backends.md.';
comment on table site_contacts is 'A site''s contact information (the phone). Spec: Project-Docs/Plan-Backends.md.';
comment on table site_socials is 'A site''s social accounts, one row each, in the owner''s order. Spec: Project-Docs/Plan-Backends.md.';
comment on table support_messages is 'Every Contact support message, for Alex''s admin. Spec: Project-Docs/Plan-Backends.md.';
