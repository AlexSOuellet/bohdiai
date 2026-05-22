-- Niches — platform-wide content the AI reads to ground tenant generations.
-- Per D17, niches live in the database (not markdown files). One row per niche.
-- Spec: project-docs/Tech-Arch-Spec.md §6
--
-- Note: the spec defines created_by / last_updated_by / approved_by as
-- `references tenant_members(user_id)`, but tenant_members.user_id is not unique
-- (a user can be a member of many tenants). These FKs cannot compile as written.
-- Switching to references auth.users(id) on delete set null — matches editor_history
-- and tracks the actual user touching the niche, which is the spec's intent.

create table niches (
  slug              text primary key,
  display_name      text not null,
  tenant_type_fit   text[] not null check (
    tenant_type_fit <@ array['seller', 'doer']::text[]
    and array_length(tenant_type_fit, 1) >= 1
  ),
  aliases           text[] not null default '{}'::text[],
  related_niches    text[] not null default '{}'::text[],
  status            text not null default 'draft' check (status in ('draft', 'in_review', 'approved', 'retired')),
  body_markdown     text not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users(id) on delete set null,
  last_updated_by   uuid references auth.users(id) on delete set null,
  approved_at       timestamptz,
  approved_by       uuid references auth.users(id) on delete set null
);

create index niches_status_idx on niches (status);
create index niches_tenant_type_fit_idx on niches using gin (tenant_type_fit);
create index niches_aliases_idx on niches using gin (aliases);

create trigger niches_set_updated_at
  before update on niches
  for each row
  execute function set_updated_at();

alter table niches enable row level security;

comment on table niches is
  'Platform-wide niche content the AI reads. Lifecycle: draft → in_review → approved → retired. Spec: Tech-Arch-Spec.md §6.';

-- Version history table (spec §6.5). Append-only snapshots of prior niche state.
create table niche_versions (
  id             uuid primary key default gen_random_uuid(),
  niche_slug     text not null references niches(slug) on delete cascade,
  snapshot       jsonb not null,
  changed_at     timestamptz not null default now(),
  changed_by     uuid references auth.users(id) on delete set null,
  change_reason  text
);

create index niche_versions_slug_changed_idx
  on niche_versions (niche_slug, changed_at desc);

alter table niche_versions enable row level security;

comment on table niche_versions is
  'Append-only history of niche edits. Each row holds the prior niches row state as jsonb. Spec: Tech-Arch-Spec.md §6.5.';
