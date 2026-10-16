-- The maker intake form (Alex, 2026-10-16): what a maker sends us to start their
-- site, on bohdiai.com/start. It will become the onboarding.
--
-- A holding place, not a site home: a maker who fills it in has no site yet. When
-- the site is built, the builder copies everything into the site's own homes and
-- marks the intake built.
--
--   intakes        one row per maker who sends the form
--   intake_pieces  the 5 to 10 pieces they send, one photo each
--   intake_words   every word the form shows, one row per spot (nothing is
--                  written into the code; the form is bohdiai.com's, not a site's)
--   intake-photos  a PRIVATE storage bucket: nobody can browse makers' photos
--                  before their site exists
--
-- Everything is written and read server-side with the service role, so RLS is on
-- with no policies: no visitor or signed-in user can read or write these.

create table if not exists intakes (
  id uuid primary key default gen_random_uuid(),
  maker_name text not null check (char_length(maker_name) between 1 and 120),
  business_name text not null check (char_length(business_name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  makes text not null check (char_length(makes) between 1 and 600),
  about text not null check (char_length(about) between 1 and 5000),
  -- The feeling they picked (lib/moods.ts); null is "you pick for me".
  mood text check (mood in ('cozy', 'rustic', 'dark', 'elegant', 'cheerful', 'modern')),
  -- Their own photo, in intake-photos; optional.
  portrait_path text check (char_length(portrait_path) <= 300),
  status text not null default 'new' check (status in ('new', 'built')),
  -- The site built from it, once it is.
  tenant_id uuid references tenants(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger intakes_set_updated_at
  before update on intakes
  for each row execute function set_updated_at();

create index if not exists intakes_created_at_idx on intakes (created_at desc);

create table if not exists intake_pieces (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid not null references intakes(id) on delete cascade,
  -- Their order on the form, from 0.
  position int not null check (position between 0 and 9),
  name text not null check (char_length(name) between 1 and 120),
  -- In cents; null is "ask me".
  price_cents int check (price_cents >= 0),
  description text check (char_length(description) <= 2000),
  photo_path text not null check (char_length(photo_path) <= 300),
  created_at timestamptz not null default now(),
  unique (intake_id, position)
);

create table if not exists intake_words (
  key text primary key check (key ~ '^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9]+)+$' and char_length(key) <= 120),
  text text not null check (char_length(text) <= 5000),
  updated_at timestamptz not null default now()
);

create trigger intake_words_set_updated_at
  before update on intake_words
  for each row execute function set_updated_at();

alter table intakes enable row level security;
alter table intake_pieces enable row level security;
alter table intake_words enable row level security;

comment on table intakes is
  'What a maker sends on bohdiai.com/start to start their site: their name, business, email, what they make, their about, their mood and their photo. A holding place; the builder copies it into the site''s homes.';
comment on table intake_pieces is
  'The 5 to 10 pieces a maker sends with the intake form, one photo each (in the private intake-photos bucket).';
comment on table intake_words is
  'Every word the intake form shows, one row per spot. Nothing is written into the code.';

-- Private: no public read. Photos arrive shrunk to WebP server-side.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('intake-photos', 'intake-photos', false, 10485760, array['image/webp'])
on conflict (id) do nothing;

create policy "service role full access on intake-photos"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'intake-photos')
  with check (bucket_id = 'intake-photos');
