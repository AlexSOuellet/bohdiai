-- The demo is always today (Saltmarsh & Lace demo spec, Alex 2026-10-12): a demo
-- site's whole timeline (markets, orders, sales, billing) was written relative to
-- the day it was reset. Each day the timeline moves forward by the days that have
-- passed, so today's market is always today and everything else keeps its distance.
-- Demo sites only (the demo_checkout switch); real sites keep the dates their
-- owners set.

-- The day the demo's timeline is anchored to. Set by demo-reset; null = not a demo
-- timeline (nothing moves).
alter table tenants add column if not exists demo_day date;

-- Move one tenant's timeline forward by `days`: every date and timestamptz column
-- of every table with a tenant_id, plus the tenant's renewal day. Found from the
-- catalog, so tables added later move too.
create or replace function demo_shift_tenant(p_tenant uuid, p_days integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t record;
  sets text;
begin
  if p_days = 0 then return; end if;
  for t in
    select c.table_name,
           string_agg(
             format('%1$I = %1$I + %2$s', c.column_name,
               case when c.data_type = 'date' then p_days::text
                    else format('make_interval(days => %s)', p_days) end),
             ', ') as cols
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.data_type in ('date', 'timestamp with time zone')
      and c.table_name <> 'tenants'
      and exists (
        select 1 from information_schema.columns k
        where k.table_schema = 'public' and k.table_name = c.table_name and k.column_name = 'tenant_id')
      and exists (
        select 1 from information_schema.tables b
        where b.table_schema = 'public' and b.table_name = c.table_name and b.table_type = 'BASE TABLE')
    group by c.table_name
  loop
    execute format('update %I set %s where tenant_id = $1', t.table_name, t.cols) using p_tenant;
  end loop;
  update tenants
     set plan_renews_on = plan_renews_on + p_days,
         demo_day = demo_day + p_days
   where id = p_tenant;
end;
$$;

-- Bring every demo timeline up to `p_today` in its own time zone (default: now).
-- Never moves backward. Returns how many sites moved.
create or replace function demo_keep_today(p_now timestamptz default now())
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
  moved integer := 0;
  gap integer;
begin
  for s in
    select t.id, t.demo_day, (p_now at time zone coalesce(t.time_zone, 'America/New_York'))::date as today
    from tenants t
    join tenant_features f on f.tenant_id = t.id and f.feature_key = 'demo_checkout' and f.enabled
    where t.demo_day is not null and t.deleted_at is null
  loop
    gap := s.today - s.demo_day;
    if gap > 0 then
      perform demo_shift_tenant(s.id, gap);
      moved := moved + 1;
    end if;
  end loop;
  return moved;
end;
$$;

revoke all on function demo_shift_tenant(uuid, integer) from public, anon, authenticated;
revoke all on function demo_keep_today(timestamptz) from public, anon, authenticated;

-- Run every hour, so each demo turns over just after its own midnight.
create extension if not exists pg_cron;
select cron.schedule('demo-keep-today', '5 * * * *', $$select public.demo_keep_today()$$);
