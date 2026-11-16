-- Go-live step 3 (Alex, 2026-11-16).
--
-- 1. Lock the site record. A signed-in maker could change any column of their own
--    tenants row straight through the database API (plan, plan_comp, subdomain,
--    stripe_account_id, status ...). Only three things are ever saved with the
--    maker's own login: the customer-accounts switch, the contact email, and the
--    site's status (Publish / take offline / put back online). Everything else is
--    saved by the server with the service role, which these grants don't touch.
revoke insert, update, delete on public.tenants from authenticated;
revoke insert, update, delete on public.tenants from anon;
grant update (buyer_accounts_on, contact_email, status) on public.tenants to authenticated;

-- 2. Suspend (Alex's admin): why, when, and the state to put back on Unsuspend.
alter table public.tenants
  add column if not exists suspended_reason text,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_from text
    check (suspended_from is null or suspended_from in ('draft', 'active', 'offline'));

-- 3. A maker's own moves only: draft -> live, live -> offline, offline -> live, and
--    never onto the web while on Free (Free has no site). A suspended or closed site
--    can't be moved by the maker at all; only the server (Alex) changes those.
create or replace function public.tenants_maker_status_moves()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') and new.status is distinct from old.status then
    if not (
      (old.status = 'draft' and new.status = 'active')
      or (old.status = 'active' and new.status = 'offline')
      or (old.status = 'offline' and new.status = 'active')
    ) or (new.status = 'active' and old.plan = 'free') then
      raise exception 'That change to the site can only be made by BohdiAI'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tenants_maker_status_moves on public.tenants;
create trigger tenants_maker_status_moves
  before update of status on public.tenants
  for each row execute function public.tenants_maker_status_moves();
