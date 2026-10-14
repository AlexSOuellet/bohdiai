-- The demo keeps its weekdays (Alex, 2026-10-14). Moving a demo's whole timeline
-- forward a day at a time turned Saturday fairs into Mondays and Tuesdays. Now the
-- timeline moves only by whole weeks, so a Saturday stays a Saturday; today's
-- market (the one a visitor buys at) still moves to today every day, together with
-- its sales, holds, costs and the pieces it brings.
--
--   tenants.demo_day       the day today's market is on (moves daily, as before)
--   tenants.demo_week_day  NEW: the day the rest of the timeline is anchored to
--                          (moves by whole weeks). Set by demo-reset; null = not a
--                          demo timeline.

alter table tenants add column if not exists demo_week_day date;
update tenants set demo_week_day = demo_day where demo_day is not null and demo_week_day is null;

-- Move one tenant's whole timeline by `p_days` (unchanged, except both anchors move).
create or replace function demo_shift_tenant(p_tenant uuid, p_days integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t record;
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
         demo_day = demo_day + p_days,
         demo_week_day = demo_week_day + p_days
   where id = p_tenant;
end;
$$;

-- Move today's market by `p_days`: the market itself and every row tied to it by
-- event_id (its sales and holds, costs, the pieces it brings), each date column.
create or replace function demo_shift_market(p_tenant uuid, p_event uuid, p_days integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t record;
begin
  if p_days = 0 then return; end if;
  for t in
    select c.table_name,
           (select count(*) > 0 from information_schema.columns k
             where k.table_schema = 'public' and k.table_name = c.table_name and k.column_name = 'event_id') as tied,
           string_agg(
             format('%1$I = %1$I + %2$s', c.column_name,
               case when c.data_type = 'date' then p_days::text
                    else format('make_interval(days => %s)', p_days) end),
             ', ') as cols
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.data_type in ('date', 'timestamp with time zone')
      and (c.table_name = 'events' or exists (
        select 1 from information_schema.columns k
        where k.table_schema = 'public' and k.table_name = c.table_name and k.column_name = 'event_id'))
      and exists (
        select 1 from information_schema.tables b
        where b.table_schema = 'public' and b.table_name = c.table_name and b.table_type = 'BASE TABLE')
    group by c.table_name
  loop
    if t.table_name = 'events' then
      execute format('update events set %s where tenant_id = $1 and id = $2', t.cols) using p_tenant, p_event;
    elsif t.tied then
      execute format('update %I set %s where tenant_id = $1 and event_id = $2', t.table_name, t.cols) using p_tenant, p_event;
    end if;
  end loop;
  -- Rows tied to the market through an order (the pieces on a sale) move with it.
  update order_items i
     set created_at = i.created_at + make_interval(days => p_days)
    from orders o
   where o.id = i.order_id and o.tenant_id = p_tenant and o.event_id = p_event;
  update tenants set demo_day = demo_day + p_days where id = p_tenant;
end;
$$;

-- Bring every demo up to today in its own time zone: the timeline by whole weeks,
-- then today's market (the market on demo_day) to today. Never moves backward.
-- Returns how many sites moved.
create or replace function demo_keep_today(p_now timestamptz default now())
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
  moved integer := 0;
  weeks integer;
  market uuid;
  market_day date;
begin
  for s in
    select t.id, t.demo_day, coalesce(t.demo_week_day, t.demo_day) as week_day,
           (p_now at time zone coalesce(t.time_zone, 'America/New_York'))::date as today
    from tenants t
    join tenant_features f on f.tenant_id = t.id and f.feature_key = 'demo_checkout' and f.enabled
    where t.demo_day is not null and t.deleted_at is null
  loop
    if s.today <= s.demo_day then continue; end if;
    -- Today's market, found before anything moves: the market on the demo day.
    select e.id into market from events e where e.tenant_id = s.id and e.event_date = s.demo_day order by e.created_at limit 1;
    weeks := (s.today - s.week_day) / 7;
    if weeks > 0 then perform demo_shift_tenant(s.id, weeks * 7); end if;
    select demo_day into market_day from tenants where id = s.id;
    if market is not null and s.today > market_day then
      perform demo_shift_market(s.id, market, s.today - market_day);
    elsif s.today > market_day then
      update tenants set demo_day = s.today where id = s.id;
    end if;
    moved := moved + 1;
  end loop;
  return moved;
end;
$$;

revoke all on function demo_shift_market(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function demo_shift_tenant(uuid, integer) from public, anon, authenticated;
revoke all on function demo_keep_today(timestamptz) from public, anon, authenticated;

-- Once: the demos' fairs already in the timeline go to the Saturday nearest them
-- (with their sales, costs and pieces), today's market stays today. From here the
-- weekly moves keep them on Saturdays.
do $$
declare
  s record;
  e record;
  delta integer;
begin
  for s in
    select t.id, t.demo_day from tenants t
    join tenant_features f on f.tenant_id = t.id and f.feature_key = 'demo_checkout' and f.enabled
    where t.demo_day is not null and t.deleted_at is null
  loop
    for e in select id, event_date from events where tenant_id = s.id and event_date <> s.demo_day loop
      -- extract(dow): Sunday 0 … Saturday 6. Ahead 0–3 days, else back.
      delta := (6 - extract(dow from e.event_date)::int + 7) % 7;
      if delta > 3 then delta := delta - 7; end if;
      if delta <> 0 then
        perform demo_shift_market(s.id, e.id, delta);
        update tenants set demo_day = s.demo_day where id = s.id;
      end if;
    end loop;
  end loop;
end;
$$;
