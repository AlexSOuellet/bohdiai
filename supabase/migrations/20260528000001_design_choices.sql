-- Bohdi's decision log. Every meaningful design choice he makes is recorded
-- here with the candidates he considered, the one he picked, and his reasoning.
-- This is the visibility layer that will eventually tell us what Bohdi
-- gravitates toward, where he's biased, and what's working.

create table design_choices (
  id              uuid        primary key default gen_random_uuid(),
  -- Nullable: a single onboarding generates many decisions BEFORE the tenant
  -- row exists. We backfill tenant_id at finalize time, or leave null for
  -- aborted runs.
  tenant_id       uuid        null references tenants(id) on delete cascade,
  -- e.g. 'palette-role-assignment', 'font-pairing', 'block-pick',
  -- 'copy-headline', 'image-brief', 'composition'.
  decision_type   text        not null,
  -- The candidates Bohdi generated. Each candidate is whatever shape makes
  -- sense for the decision_type, plus a 'reasoning' field per candidate.
  candidates      jsonb       not null,
  -- The candidate Bohdi picked. Same shape as one element of candidates.
  picked          jsonb       not null,
  -- Bohdi's overall reasoning for the pick (why this one out of the candidates).
  reasoning       text        not null,
  niche_slug      text        null,
  mood_key        text        null,
  created_at      timestamptz not null default now()
);

create index design_choices_tenant_idx        on design_choices (tenant_id);
create index design_choices_type_idx          on design_choices (decision_type);
create index design_choices_niche_mood_idx    on design_choices (niche_slug, mood_key);
create index design_choices_created_at_idx    on design_choices (created_at desc);

alter table design_choices enable row level security;

comment on table design_choices is
  'Bohdi''s decision log — candidates considered, choice picked, reasoning, per generation. Service role only.';
