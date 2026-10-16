-- The maker makes their account on the intake form (Alex, 2026-10-16): beside their
-- email they choose a password, so when their site is built they simply sign in and
-- publish it, with no invite link to expire. This records which account sent each
-- form, so the builder knows who owns the site. The password itself lives only in
-- Supabase's sign-in system (auth.users), never here.

alter table intakes add column user_id uuid references auth.users(id) on delete set null;

comment on column intakes.user_id is
  'The account the maker made on the form (email + their own password). The builder makes it the site''s owner.';
