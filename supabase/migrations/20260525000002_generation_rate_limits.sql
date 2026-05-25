-- Rate limiting for the AI storefront generation endpoint.
-- One row per IP. Sliding hourly window: count resets when window_start is over an hour old.
-- Limit: 3 generations per IP per hour (enforced in lib/rate-limit.ts).

create table if not exists public.generation_rate_limits (
  ip          text        primary key,
  count       integer     not null default 0,
  window_start timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Service role only — no user-facing reads/writes
alter table public.generation_rate_limits enable row level security;

-- Rows older than 24h are irrelevant; prune via a cron job in a later phase.
-- For now the application logic handles window resets inline.
