-- Alex's admin shows how many messages, reports and feedback responses have come in
-- since he last opened that tab (Alex, 2026-11-16). One row per tab: when he last
-- looked. Only Alex uses the admin, so there's no user column.
create table founder_seen (
  tab text primary key check (tab in ('messages', 'reports', 'feedback')),
  seen_at timestamptz not null default now()
);

-- Read and written by the admin's server with the service role only.
alter table founder_seen enable row level security;

comment on table founder_seen is 'When Alex last opened each admin tab, for the new-item counts on the tabs.';
