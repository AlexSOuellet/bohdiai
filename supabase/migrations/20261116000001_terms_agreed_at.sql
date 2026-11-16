-- Go-live step 3 (Alex, 2026-11-16): the date a maker agreed to the maker terms and
-- the list of what can't be sold or shown, ticked at sign-up. Kept so there's proof
-- if a site ever has to come down. Null for sites made before the tick box.
alter table public.tenants add column if not exists terms_agreed_at timestamptz;
