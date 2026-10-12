#!/usr/bin/env node
/**
 * Proves the demo's daily move (migration 20261012000001) against the real
 * database, inside a transaction that is always rolled back, so nothing changes.
 *
 *   node scripts/check-demo-always-today.mjs [subdomain]   (default saltmarsh-and-lace)
 *
 * Pretends the demo was last anchored three days ago, runs demo_keep_today(), and
 * checks every market date, order time and the renewal day moved forward exactly
 * three days, a second run moves nothing, and a non-demo site is untouched.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

const subdomain = process.argv[2] ?? 'saltmarsh-and-lace';
const client = new pg.Client({ connectionString: connectionString(loadEnv()) });
const failures = [];
const check = (ok, what) => {
  process.stdout.write(`${ok ? 'ok  ' : 'FAIL'} ${what}\n`);
  if (!ok) failures.push(what);
};

const snapshot = async (tenantId) => {
  const ev = await client.query('select id, event_date::text d from events where tenant_id = $1 order by id', [tenantId]);
  const or = await client.query('select id, extract(epoch from created_at)::bigint s from orders where tenant_id = $1 order by id', [tenantId]);
  const tn = await client.query('select plan_renews_on::text r, demo_day::text a from tenants where id = $1', [tenantId]);
  return { events: ev.rows, orders: or.rows, tenant: tn.rows[0] };
};
const plusDays = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

await client.connect();
try {
  await client.query('begin');
  const { rows } = await client.query(
    `select t.id, (now() at time zone coalesce(t.time_zone, 'America/New_York'))::date::text today
       from tenants t where subdomain = $1 and deleted_at is null`, [subdomain]);
  if (rows.length === 0) throw new Error(`no site "${subdomain}"`);
  const { id, today } = rows[0];
  const other = (await client.query(
    `select id from tenants t where deleted_at is null and not exists (
       select 1 from tenant_features f where f.tenant_id = t.id and f.feature_key = 'demo_checkout' and f.enabled)
     limit 1`)).rows[0];

  // Anchor three days back, and give the non-demo site an anchor too (it must still not move).
  await client.query('update tenants set demo_day = $2::date - 3 where id = $1', [id, today]);
  if (other) await client.query('update tenants set demo_day = $2::date - 3 where id = $1', [other.id, today]);
  const before = await snapshot(id);
  const otherBefore = other ? await snapshot(other.id) : null;

  const moved = (await client.query('select demo_keep_today() n')).rows[0].n;
  const after = await snapshot(id);

  check(moved >= 1, `demo_keep_today moved ${moved} site(s)`);
  check(after.tenant.a === today, `anchor is today (${after.tenant.a})`);
  check(before.events.length > 0 && before.events.every((e, i) => after.events[i].d === plusDays(e.d, 3)), `all ${before.events.length} market dates moved 3 days`);
  check(before.orders.every((o, i) => Number(after.orders[i].s) - Number(o.s) === 3 * 86400), `all ${before.orders.length} order times moved 3 days`);
  check(before.tenant.r === null || after.tenant.r === plusDays(before.tenant.r, 3), 'renewal day moved 3 days');

  const again = (await client.query('select demo_keep_today() n')).rows[0].n;
  check(Number(again) === 0, 'a second run moves nothing');

  if (other) {
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
