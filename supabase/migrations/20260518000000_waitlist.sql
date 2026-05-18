-- Waitlist table for Phase 0
-- Per Phase 0 spec §8: server-side-only access via service_role.
-- RLS is enabled with NO policies so the anon/public key cannot reach this table.
-- Phase 1 will introduce policies when tenant data exists.

create extension if not exists "pgcrypto";

create table if not exists public.waitlist (
  id              uuid primary key default gen_random_uuid(),
  email           text not null,
  type            text not null check (type in ('founder', 'notify')),
  confirm_token   uuid,
  confirmed_at    timestamptz,
  created_at      timestamptz not null default now(),
  ip              inet,
  user_agent      text
);

create unique index if not exists waitlist_email_unique on public.waitlist (lower(email));
create index if not exists waitlist_type_idx on public.waitlist (type);
create index if not exists waitlist_confirm_token_idx on public.waitlist (confirm_token)
  where confirm_token is not null;

alter table public.waitlist enable row level security;
-- Intentionally no policies. service_role bypasses RLS; anon/public is locked out.
