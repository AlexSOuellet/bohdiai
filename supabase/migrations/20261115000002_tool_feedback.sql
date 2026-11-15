-- Feedback from the share-only "try the tools" page (Alex approved, 2026-11-15).
-- One row per response: what they think or want, which tool ideas they'd use,
-- and an optional name, email and what they make. Not permanent: the page comes
-- down when Alex has his feedback. Starts empty.

create table tool_feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null default '' check (char_length(message) <= 2000),
  wants text[] not null default '{}' check (cardinality(wants) <= 20),
  name text not null default '' check (char_length(name) <= 80),
  email text not null default '' check (char_length(email) <= 200),
  makes text not null default '' check (char_length(makes) <= 120),
  created_at timestamptz not null default now(),
  check (char_length(message) > 0 or cardinality(wants) > 0)
);
create index tool_feedback_created on tool_feedback (created_at desc);

-- No one reads or writes it from the browser: the page's server saves it and
-- Alex's admin reads it, both with the service role.
alter table tool_feedback enable row level security;

comment on table tool_feedback is 'Responses from the share-only try-the-tools page (feedback, tool ideas wanted). Temporary. Spec: Project-Docs/session-logs/session-122.md.';
