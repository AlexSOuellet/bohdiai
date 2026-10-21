#!/usr/bin/env node
/**
 * Proves today's demo market lands on today (migration 20261021000003) against the
 * real database, inside a transaction that is always rolled back.
 *
 *   node scripts/check-demo-market-today.mjs [subdomain] [--with-migration]
 *
 * Cases, each from a fresh anchor: the night the bug hit (today's market moved
 * yesterday, a week since the last weekly move), a market already a week ahead
 * (the state it left behind), and an ordinary next day. A second run moves nothing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATION = path.join(repoRoot, 'supabase', 'migrations', '20261021000003_demo_market_stays_today.sql');
const env = Object.fromEntries(fs.readFileSync(path.join(repoRoot, '.env.local'), 'utf8').split(/\r?\n/).map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].trim()]));
const ref = new URL(env.SUPABASE_URL).hostname.split('.')[0];
const sub = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'saltmarsh-and-lace';
const withMigration = process.argv.includes('--with-migration');
const c = new pg.Client({ connectionString: env.SUPABASE_DB_URL ?? `postgres://postgres:${encodeURIComponent(env.SUPABASE_DB_PASSWORD)}@db.${ref}.supabase.co:5432/postgres` });
await c.connect();
let failures = 0;
const check = (ok, label) => {
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);
};

await c.query('begin');
try {
  if (withMigration) await c.query(fs.readFileSync(MIGRATION, 'utf8'));
  const t = (await c.query(`select id, (now() at time zone coalesce(time_zone, 'America/New_York'))::date::text today from tenants where subdomain = $1`, [sub])).rows[0];
  const market = (await c.query(`select e.id from events e join tenants t on t.id = e.tenant_id where t.id = $1 and e.event_date = t.demo_day order by e.created_at limit 1`, [t.id])).rows[0];
  const cases = [
    { label: 'the night it broke: market moved yesterday, a week since the weekly move', day: -1, week: -7 },
    { label: 'a market left a week ahead', day: 6, week: 0 },
    { label: 'an ordinary next day', day: -1, week: -3 },
  ];
  for (const k of cases) {
    await c.query('savepoint s');
    // Put the anchor where the case says, with the market on it.
    await c.query(`update events set event_date = $2::date + $3::int where id = $1`, [market.id, t.today, k.day]);
    await c.query(`update tenants set demo_day = $2::date + $3::int, demo_week_day = $2::date + $4::int where id = $1`, [t.id, t.today, k.day, k.week]);
    await c.query('select demo_keep_today()');
    const after = (await c.query(`select t.demo_day::text d, e.event_date::text m from tenants t, events e where t.id = $1 and e.id = $2`, [t.id, market.id])).rows[0];
    check(after.d === t.today && after.m === t.today, `${k.label}: market on ${after.m}, demo day ${after.d}, today ${t.today}`);
    const again = Number((await c.query('select demo_keep_today() n')).rows[0].n);
    const still = (await c.query(`select demo_day::text d from tenants where id = $1`, [t.id])).rows[0];
    check(still.d === t.today && again >= 0, `${k.label}: a second run leaves it on today`);
    await c.query('rollback to savepoint s');
  }
} finally {
  await c.query('rollback');
  await c.end();
}
if (failures > 0) process.exit(1);
