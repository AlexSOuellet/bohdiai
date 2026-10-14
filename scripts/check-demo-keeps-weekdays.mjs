#!/usr/bin/env node
/**
 * Proves the demo keeps its weekdays (migration 20261014000003) against the real
 * database, inside a transaction that is always rolled back, so nothing changes.
 *
 *   node scripts/check-demo-keeps-weekdays.mjs [subdomain] [--with-migration]
 *
 * --with-migration runs the migration inside the same rolled-back transaction
 * first, so the change can be proven before it is applied.
 *
 * Two cases, each from a fresh anchor: three days later (no whole week has
 * passed: only today's market and its sales move, to today) and ten days later
 * (the whole timeline moves one week, so every other market keeps its weekday,
 * then today's market moves to today). A second run moves nothing, and a non-demo
 * site never moves.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATION = path.join(repoRoot, 'supabase', 'migrations', '20261014000003_demo_weeks_keep_weekdays.sql');

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(path.join(repoRoot, '.env.local'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

function connectionString(env) {
  if (env.SUPABASE_DB_URL) return env.SUPABASE_DB_URL;
  const ref = new URL(env.SUPABASE_URL).hostname.split('.')[0];
  return `postgres://postgres:${encodeURIComponent(env.SUPABASE_DB_PASSWORD)}@db.${ref}.supabase.co:5432/postgres`;
}

const args = process.argv.slice(2);
const withMigration = args.includes('--with-migration');
const subdomain = args.find((a) => !a.startsWith('--')) ?? 'saltmarsh-and-lace';
const client = new pg.Client({ connectionString: connectionString(loadEnv()) });
const failures = [];
const check = (ok, what) => {
  process.stdout.write(`${ok ? 'ok  ' : 'FAIL'} ${what}\n`);
  if (!ok) failures.push(what);
};
const plusDays = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const weekday = (day) => new Date(`${day}T00:00:00Z`).getUTCDay();

const snapshot = async (tenantId) => {
  const ev = await client.query('select id, event_date::text d from events where tenant_id = $1 order by id', [tenantId]);
  const or = await client.query('select id, event_id, extract(epoch from created_at)::bigint s from orders where tenant_id = $1 order by id', [tenantId]);
  const tn = await client.query('select demo_day::text a, demo_week_day::text w from tenants where id = $1', [tenantId]);
  return { events: ev.rows, orders: or.rows, tenant: tn.rows[0] };
};

/** Anchor the demo `back` days ago, with today's market on that day, then run the job. */
async function runCase(id, today, back) {
  await client.query('savepoint c');
  const market = (await client.query('select id from events where tenant_id = $1 and event_date = (select demo_day from tenants where id = $1) order by created_at limit 1', [id])).rows[0];
  if (market === undefined) throw new Error('the demo has no market on its demo day');
  // Move the whole timeline (and both anchors) back, as if the demo was last current `back` days ago.
  await client.query('select demo_shift_tenant($1, $2)', [id, -back]);
  const before = await snapshot(id);
  const moved = Number((await client.query('select demo_keep_today() n')).rows[0].n);
  const after = await snapshot(id);
  const weeks = Math.floor(back / 7) * 7;
  const byId = (rows) => new Map(rows.map((r) => [r.id, r]));
  const evAfter = byId(after.events);
  const orAfter = byId(after.orders);

  check(moved >= 1, `${back} days on: the job moved the demo`);
  check(after.tenant.a === today, `${back} days on: today's market day is today (${after.tenant.a})`);
  check(after.tenant.w === plusDays(before.tenant.w, weeks), `${back} days on: the week anchor moved ${weeks} days`);
  check(evAfter.get(market.id).d === today, `${back} days on: today's market is today`);
  const others = before.events.filter((e) => e.id !== market.id);
  check(others.length > 0 && others.every((e) => evAfter.get(e.id).d === plusDays(e.d, weeks)), `${back} days on: the other ${others.length} markets moved ${weeks} days`);
  check(others.every((e) => weekday(evAfter.get(e.id).d) === weekday(e.d)), `${back} days on: every other market kept its weekday`);
  const marketOrders = before.orders.filter((o) => o.event_id === market.id);
  check(marketOrders.every((o) => Number(orAfter.get(o.id).s) - Number(o.s) === back * 86400), `${back} days on: today's ${marketOrders.length} sales and holds moved ${back} days`);
  const otherOrders = before.orders.filter((o) => o.event_id !== market.id);
  check(otherOrders.every((o) => Number(orAfter.get(o.id).s) - Number(o.s) === weeks * 86400), `${back} days on: the other ${otherOrders.length} orders moved ${weeks} days`);
  const again = Number((await client.query('select demo_keep_today() n')).rows[0].n);
  check(again === 0, `${back} days on: a second run moves nothing`);
  await client.query('rollback to savepoint c');
}

await client.connect();
try {
  await client.query('begin');
  if (withMigration) await client.query(fs.readFileSync(MIGRATION, 'utf8'));
  const { rows } = await client.query(
    `select t.id, (now() at time zone coalesce(t.time_zone, 'America/New_York'))::date::text today
       from tenants t where subdomain = $1 and deleted_at is null`, [subdomain]);
  if (rows.length === 0) throw new Error(`no site "${subdomain}"`);
  const { id, today } = rows[0];
  // Bring the demo to today first (a no-op when it already is).
  await client.query('select demo_keep_today()');
  if (withMigration) {
    const days = (await client.query('select e.event_date::text d, e.event_date = t.demo_day today from events e join tenants t on t.id = e.tenant_id where t.id = $1', [id])).rows;
    check(days.filter((r) => !r.today).every((r) => weekday(r.d) === 6), `after the migration every fair but today's is on a Saturday (${days.length} markets)`);
    check(days.some((r) => r.today), "after the migration today's market is still today");
  }

  const other = (await client.query(
    `select id from tenants t where deleted_at is null and not exists (
       select 1 from tenant_features f where f.tenant_id = t.id and f.feature_key = 'demo_checkout' and f.enabled)
     limit 1`)).rows[0];
  if (other) await client.query('update tenants set demo_day = $2::date - 10, demo_week_day = $2::date - 10 where id = $1', [other.id, today]);
  const otherBefore = other ? await snapshot(other.id) : null;

  await runCase(id, today, 3);
  await runCase(id, today, 10);

  if (other) {
    await client.query('select demo_keep_today()');
    const otherAfter = await snapshot(other.id);
    check(JSON.stringify(otherAfter.events) === JSON.stringify(otherBefore.events), 'a non-demo site does not move');
  }
} finally {
  await client.query('rollback');
  await client.end();
}

if (failures.length > 0) {
  process.stderr.write(`\n${failures.length} check(s) failed\n`);
  process.exit(1);
}
process.stdout.write('\nall checks passed (rolled back, nothing changed)\n');
