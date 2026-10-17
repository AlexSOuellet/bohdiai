-- The scene library moves into the database (Alex approved, Session 107,
-- 2026-10-17). Every Scenic build generates photos for the site being built
-- and adds them here, so the library grows with every site; any Scenic site can
-- use any scene. Photos are tagged and searchable (Alex).
--
--   key          the scene's name ("classic-loafs-1"), what a site's pick points at
--   url          the photo, in the platform's own storage (not a site's folder)
--   focus        where its point of interest sits (CSS background-position)
--   tone         how light it is: a dark one turns the opening's lettering light
--   tags         what's in it and the kinds of work it suits
--   description  the picture description it was made from (or what it shows)
--   source       platform (hand-picked) or generated
--   made_for     the site it was first made for, if any
--   search       tags + description, for searching the library by any word
--
-- Read by the storefront (service role) and by signed-in owners (picking a
-- scene); written only by the builder (service role).

-- Tags and description as one text, for the search index (array_to_string isn't
-- marked immutable, so a generated column needs it wrapped).
create or replace function scene_search_text(p_tags text[], p_description text)
returns text
language sql
immutable
as $$
  select coalesce(array_to_string(p_tags, ' '), '') || ' ' || coalesce(p_description, '');
$$;

create table if not exists scenes (
  key text primary key check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  url text not null check (char_length(url) between 1 and 1000),
  focus text not null default 'center' check (char_length(focus) between 1 and 40),
  tone text not null default 'light' check (tone in ('light', 'dark')),
  tags text[] not null default '{}',
  description text not null default '' check (char_length(description) <= 2000),
  source text not null check (source in ('platform', 'generated')),
  made_for uuid references tenants(id) on delete set null,
  search tsvector generated always as (
    to_tsvector('english'::regconfig, scene_search_text(tags, description))
  ) stored,
  created_at timestamptz not null default now()
);

create index if not exists scenes_search_idx on scenes using gin (search);
create index if not exists scenes_tags_idx on scenes using gin (tags);

alter table scenes enable row level security;

create policy scenes_read on scenes for select to authenticated using (true);

comment on table scenes is
  'The scene library: photos any Scenic site can paint behind its page, tagged and searchable. Every Scenic build adds the ones it makes. Spec: Project-Docs/Modular-Plan.md, The lineup.';

-- The marsh, the first scene (it was the code list's only entry).
insert into scenes (key, url, focus, tone, tags, description, source)
values (
  'marsh',
  '/scenes/marsh.webp',
  'center 62%',
  'light',
  array['coastal', 'marsh', 'water', 'sky', 'dusk', 'outdoors', 'calm'],
  'A salt marsh at dusk: open sky over still water, a low far shore.',
  'platform'
)
on conflict (key) do nothing;

-- A site's library pick must be a real scene.
alter table site_scenes
  add constraint site_scenes_scene_key_fkey foreign key (scene_key) references scenes(key) on delete restrict;
