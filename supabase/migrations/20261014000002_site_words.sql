-- Each site's own words (Alex, 2026-10-14: "NOTHING should EVER be written into
-- the code ... buttons too. A maker may want to change them.").
--
-- One row per word a site shows: its buttons, menu names, form labels, messages,
-- screen-reader labels and the rest. The key names the spot ("card.form.send");
-- the text is what that site says there ("Send message"). A word with a blank in
-- it carries the blank by name ("Open photo: {caption}"). Designs read only from
-- here; a site's words are written when the site is built and can be changed
-- later. No backend screen yet (Alex). Section headings keep their own home in
-- site_sections.
--
-- The storefront reads with the service role; RLS matches the other homes
-- (tenant admins only).

create table if not exists site_words (
  tenant_id uuid not null references tenants(id) on delete cascade,
  key text not null check (key ~ '^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9]+)+$' and char_length(key) <= 120),
  text text not null check (char_length(text) <= 5000),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, key)
);

create trigger site_words_set_updated_at
  before update on site_words
  for each row execute function set_updated_at();

alter table site_words enable row level security;

create policy site_words_admin_select on site_words
  for select to authenticated using (is_tenant_admin(tenant_id));
create policy site_words_admin_insert on site_words
  for insert to authenticated with check (is_tenant_admin(tenant_id));
create policy site_words_admin_update on site_words
  for update to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));
create policy site_words_admin_delete on site_words
  for delete to authenticated using (is_tenant_admin(tenant_id));

comment on table site_words is
  'Each site''s own words: buttons, menu names, form labels, messages and every other word its design shows, one row per spot. Designs read only from here; nothing is written into the code. Section headings live in site_sections.';
