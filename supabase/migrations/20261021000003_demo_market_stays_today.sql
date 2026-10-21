-- Fix: the demo's market fell a week ahead (Alex, 2026-10-21: "the demo is supposed
-- to automatically make the market today"). Each day today's market moves to today;
-- once a week the whole timeline moves a week so fairs stay on Saturdays. When both
-- happened on the same night, the weekly move carried today's market (already moved
-- day by day) a further week ahead, and the timer only moved forward, so it stayed
-- there. Now, after any weekly move, today's market is put on today whichever way
-- that is, and a demo whose market is ahead of today is brought back too. Function
-- only; no table or column changes.

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
    weeks := greatest((s.today - s.week_day) / 7, 0);
    if s.today = s.demo_day and weeks = 0 then continue; end if;
    -- Today's market, found before anything moves: the market on the demo day.
    select e.id into market from events e where e.tenant_id = s.id and e.event_date = s.demo_day order by e.created_at limit 1;
    if weeks > 0 then perform demo_shift_tenant(s.id, weeks * 7); end if;
    select demo_day into market_day from tenants where id = s.id;
    if market is not null and s.today <> market_day then
      perform demo_shift_market(s.id, market, s.today - market_day);
    elsif s.today <> market_day then
      update tenants set demo_day = s.today where id = s.id;
    end if;
    moved := moved + 1;
  end loop;
  return moved;
end;
$$;

revoke all on function demo_keep_today(timestamptz) from public, anon, authenticated;
