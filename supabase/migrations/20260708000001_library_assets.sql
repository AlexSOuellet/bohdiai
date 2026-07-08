-- ─── Library assets — shared mood-neutral image and video library ───────────
-- Cowork generates images (Nano Banana Pro at 2K) and hero videos (Kling 3.0
-- Turbo at 720p, 3s, locked camera) into this table. Onboarding pulls approved
-- rows instead of running fal per build. Family CSS filter applies mood at
-- render time — the library assets themselves are mood-neutral.
--
-- Spec: Project-Docs/Image-Library-Spec.md
-- Plan: Project-Docs/Library-Buildout-Plan.md
--
-- Every row lands approved=false; Alex flips approved=true after eyeballing.
-- Onboarding SELECTs approved rows filtered by niche + kind, picks one.

create table if not exists public.library_assets (
  id          uuid primary key default gen_random_uuid(),
  niche_slug  text not null,
  kind        text not null check (kind in (
                'hero_image', 'product_image', 'portrait_image', 'hero_video'
              )),
  scene       text,
  storage_path text not null unique,
  prompt      text not null,
  generator   text not null,
  width       integer not null,
  height      integer not null,
  duration_ms integer,
  approved    boolean not null default false,
  generated_at timestamptz not null default now(),
  approved_at timestamptz,
  retired_at  timestamptz
);

-- Onboarding's hot query: unapproved and retired rows are hidden.
create index if not exists library_assets_niche_kind_active_idx
  on public.library_assets (niche_slug, kind)
  where approved = true and retired_at is null;

-- Every insert comes from the ingest endpoint using service role. No client
-- ever queries this directly, so RLS enabled with no policies.
alter table public.library_assets enable row level security;

comment on table public.library_assets is
  'Mood-neutral image and video library. Cowork writes via /api/library/ingest; onboarding reads approved rows. See Project-Docs/Image-Library-Spec.md.';

-- ─── Storage bucket for the binaries ─────────────────────────────────────────
-- Public read so storefront pages can serve URLs directly. Service role only
-- for writes — cowork goes through the ingest endpoint, never touches this
-- bucket directly.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'library',
  'library',
  true,
  20971520, -- 20MB per file (2K images run larger than the fal bucket; video hits this hardest)
  array['image/png', 'image/jpeg', 'image/webp', 'video/mp4']
)
on conflict (id) do nothing;

create policy "service role full access on library"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'library')
  with check (bucket_id = 'library');

create policy "public read on library"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'library');
