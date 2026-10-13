-- Homes for the family content that had none (Modular Plan, step 2; Alex
-- 2026-10-13). Every piece of content gets its own home that any design can
-- read, so nothing has to live in a page record and a site can switch designs
-- with every piece landing in its section.
--
-- Already homed, unchanged here: products and collections, market dates
-- (events), testimonials (site_testimonials), the gallery, and About you's
-- headline, story and signature (site_profiles).
--
-- New:
--   site_sections       one row per site per section: the section's own words
--                       (its heading, the line above and below it, its link,
--                       its empty message, its menu name and its page title).
--                       The closing line and the contact intro live here.
--   site_moments        the moment (the hero): story lines, headline, sub-line,
--                       buttons, play setting, and its photo or video as an upload.
--   site_moment_photos  the moment's extra photos (the collage), as uploads.
--   site_profiles       + the founder quote and who it's from, the portrait as an
--                       upload, and the marquee phrases. The story's cap rises
--                       from 1500 to 5000: family stories run longer.
--
-- The storefront reads with the service role; the owner manages these in the
-- backend, so RLS matches the other homes (tenant admins only).

-- The sections every design shares. A design shows the ones it has, in its own
-- order; the words come from here.
create table if not exists site_sections (
  tenant_id uuid not null references tenants(id) on delete cascade,
  section text not null check (section in (
    'work',         -- the maker's pieces on the home page (the shop / the shelf)
    'collections',  -- collection groups
    'makes',        -- the short list of what the maker makes
    'about',        -- the maker, on the home page
    'reviews',      -- what customers say
    'markets',      -- where to find the maker in person
    'close',        -- the closing line
    'contact'       -- getting in touch
  )),
  kicker text check (kicker is null or char_length(kicker) between 1 and 60),
  title text check (title is null or char_length(title) between 1 and 160),
  lede text check (lede is null or char_length(lede) between 1 and 600),
  more_label text check (more_label is null or char_length(more_label) between 1 and 60),
  more_target text check (more_target is null or more_target in ('home', 'shop', 'about', 'events', 'contact', 'collections', 'testimonials')),
  empty_text text check (empty_text is null or char_length(empty_text) between 1 and 200),
  nav_label text check (nav_label is null or char_length(nav_label) between 1 and 40),
  page_title text check (page_title is null or char_length(page_title) between 1 and 160),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, section)
);

create trigger site_sections_set_updated_at
  before update on site_sections
  for each row execute function set_updated_at();

alter table site_sections enable row level security;

create policy site_sections_admin_select on site_sections
  for select to authenticated using (is_tenant_admin(tenant_id));
create policy site_sections_admin_insert on site_sections
  for insert to authenticated with check (is_tenant_admin(tenant_id));
create policy site_sections_admin_update on site_sections
  for update to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));
create policy site_sections_admin_delete on site_sections
  for delete to authenticated using (is_tenant_admin(tenant_id));

comment on table site_sections is
  'Each section''s own words for one site: heading, the lines around it, its link, empty message, menu name and page title. Every design reads its headings here. Spec: Project-Docs/Modular-Plan.md step 2.';

-- The moment: the first thing a visitor sees.
create table if not exists site_moments (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  kicker text check (kicker is null or char_length(kicker) between 1 and 60),
  headline text check (headline is null or char_length(headline) between 1 and 160),
  sub text check (sub is null or char_length(sub) between 1 and 300),
  story text[] check (story is null or cardinality(story) between 1 and 8),
  cta_label text check (cta_label is null or char_length(cta_label) between 1 and 40),
  cta_target text check (cta_target is null or cta_target in ('home', 'shop', 'about', 'events', 'contact', 'collections', 'testimonials')),
  second_cta_label text check (second_cta_label is null or char_length(second_cta_label) between 1 and 40),
  second_cta_target text check (second_cta_target is null or second_cta_target in ('home', 'shop', 'about', 'events', 'contact', 'collections', 'testimonials')),
  play_mode text not null default 'once' check (play_mode in ('once', 'always', 'off')),
  media_upload_id uuid references uploads(id) on delete set null,
  poster_upload_id uuid references uploads(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Each story line is short: the lines cross-fade large, one at a time.
create or replace function site_moment_story_ok(p_story text[])
returns boolean
language sql
immutable
as $$
  select p_story is null or not exists (
    select 1 from unnest(p_story) line where char_length(line) not between 1 and 120
  );
$$;

alter table site_moments add constraint site_moments_story_lines check (site_moment_story_ok(story));

create trigger site_moments_set_updated_at
  before update on site_moments
  for each row execute function set_updated_at();

alter table site_moments enable row level security;

create policy site_moments_admin_select on site_moments
  for select to authenticated using (is_tenant_admin(tenant_id));
create policy site_moments_admin_insert on site_moments
  for insert to authenticated with check (is_tenant_admin(tenant_id));
create policy site_moments_admin_update on site_moments
  for update to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));
create policy site_moments_admin_delete on site_moments
  for delete to authenticated using (is_tenant_admin(tenant_id));

comment on table site_moments is
  'A site''s moment (the hero): story lines, headline, sub-line, buttons, play setting, and its photo or video as an upload. Spec: Project-Docs/Modular-Plan.md step 2.';

-- The moment's extra photos (a design that shows several, like a collage).
create table if not exists site_moment_photos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  upload_id uuid not null references uploads(id) on delete restrict,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_moment_photos_tenant_position on site_moment_photos (tenant_id, position);

create trigger site_moment_photos_set_updated_at
  before update on site_moment_photos
  for each row execute function set_updated_at();

alter table site_moment_photos enable row level security;

create policy site_moment_photos_admin_select on site_moment_photos
  for select to authenticated using (is_tenant_admin(tenant_id));
create policy site_moment_photos_admin_insert on site_moment_photos
  for insert to authenticated with check (is_tenant_admin(tenant_id));
create policy site_moment_photos_admin_update on site_moment_photos
  for update to authenticated using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));
create policy site_moment_photos_admin_delete on site_moment_photos
  for delete to authenticated using (is_tenant_admin(tenant_id));

comment on table site_moment_photos is
  'The moment''s extra photos in the owner''s order, as uploads. Spec: Project-Docs/Modular-Plan.md step 2.';

-- About you: the founder quote, the portrait and the marquee phrases.
alter table site_profiles
  add column if not exists quote text check (quote is null or char_length(quote) between 1 and 600),
  add column if not exists quote_attribution text check (quote_attribution is null or char_length(quote_attribution) between 1 and 80),
  add column if not exists portrait_upload_id uuid references uploads(id) on delete set null,
  add column if not exists marquee_phrases text[] check (marquee_phrases is null or cardinality(marquee_phrases) between 1 and 12);

create or replace function site_marquee_phrases_ok(p_phrases text[])
returns boolean
language sql
immutable
as $$
  select p_phrases is null or not exists (
    select 1 from unnest(p_phrases) phrase where char_length(phrase) not between 1 and 60
  );
$$;

alter table site_profiles add constraint site_profiles_marquee_phrase_length check (site_marquee_phrases_ok(marquee_phrases));

-- The story's cap rises from 1500 to 5000.
alter table site_profiles drop constraint if exists site_profiles_bio_check;
alter table site_profiles add constraint site_profiles_bio_check check (bio is null or char_length(bio) between 1 and 5000);
