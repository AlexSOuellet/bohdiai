-- Feature flags — per Engineering Standards §13.
-- Simple in-DB table. No third-party service in Phase 1.
-- enabled=true means the flag is on for everyone.
-- allowlist holds tenant UUIDs who can access the flag when enabled=false.

create table feature_flags (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null unique,
  enabled     boolean     not null default false,
  allowlist   uuid[]      not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger feature_flags_updated_at
  before update on feature_flags
  for each row execute function set_updated_at();

alter table feature_flags enable row level security;

comment on table feature_flags is
  'Per Engineering-Standards §13. Flags gate user-facing features. Service role only — no public reads.';

-- Seed flags for all Phase 1 features currently in development.
-- Set enabled=true so the dev and preview environments work immediately.
-- Flip to false in production before a controlled rollout.
insert into feature_flags (name, enabled) values
  ('onboarding', true);
