-- Builds — tracks a storefront build that runs in the background, decoupled from
-- the request that started it. The onboarding screen kicks off a build, gets an
-- id, and polls this row for progress and the final result. This is what lets a
-- build run longer than a single request's time limit.

create table builds (
  id            uuid primary key default gen_random_uuid(),
  status        text not null default 'pending' check (status in (
                  'pending', 'running', 'done', 'failed'
                )),
  status_label  text,
  -- The full build input, kept so a failed build can be retried or resumed
  -- without the maker re-entering anything.
  input         jsonb not null,
  subdomain     text not null,
  tenant_id     uuid references tenants(id) on delete set null,
  error         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  started_at    timestamptz,
  finished_at   timestamptz,
  constraint builds_input_is_object check (jsonb_typeof(input) = 'object')
);

create index builds_status_idx on builds (status, created_at desc);

create trigger builds_set_updated_at
  before update on builds
  for each row
  execute function set_updated_at();

alter table builds enable row level security;

comment on table builds is
  'Background storefront builds. The onboarding screen starts a build, gets an id, and polls for progress + result so the build can outlast a single request.';
