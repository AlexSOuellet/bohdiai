-- Harden the reset lookup: empty search_path (everything schema-qualified) and
-- ignore soft-deleted users. Same privileges: service_role only.
create or replace function public.auth_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select id from auth.users
  where pg_catalog.lower(email) = pg_catalog.lower(p_email) and deleted_at is null
  limit 1
$$;
revoke all on function public.auth_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.auth_user_id_by_email(text) to service_role;
