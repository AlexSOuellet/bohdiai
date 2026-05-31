#!/usr/bin/env tsx
// Score a tenant's stored layout trees against the slop floor.
//
// Usage: npx tsx scripts/score-slop.ts <subdomain>
//
// Reads the tenant's content_pages.layout_tree rows straight from Postgres and
// runs scoreSlop against each. This is how we check the meter against real
// builds — not fixtures.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { scoreSlop } from '../lib/slop-floor';
import type { Page } from '../lib/layout';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function loadEnv(): Record<string, string> {
  const raw = fs.readFileSync(path.join(repoRoot, '.env.local'), 'utf8');
  const env: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && m[1] && m[2] !== undefined) env[m[1]] = m[2].trim();
  }
  return env;
}

function connString(env: Record<string, string>): string {
  if (env['SUPABASE_DB_URL']) return env['SUPABASE_DB_URL'];
  const url = env['SUPABASE_URL'];
  const password = env['SUPABASE_DB_PASSWORD'];
  if (!url || !password) throw new Error('SUPABASE_URL / SUPABASE_DB_PASSWORD not set');
  const ref = new URL(url).hostname.split('.')[0];
  return `postgres://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
}

async function main(): Promise<void> {
  const subdomain = process.argv[2];
  if (!subdomain) throw new Error('Usage: tsx scripts/score-slop.ts <subdomain>');

  const env = loadEnv();
  const client = new Client({ connectionString: connString(env) });
  await client.connect();
  try {
    const { rows } = await client.query(
      `SELECT cp.slug, cp.layout_tree
         FROM content_pages cp
         JOIN tenants t ON t.id = cp.tenant_id
        WHERE t.subdomain = $1
        ORDER BY cp.slug`,
      [subdomain],
    );
    if (rows.length === 0) {
      console.log(`No pages found for "${subdomain}".`);
      return;
    }
    for (const row of rows as Array<{ slug: string; layout_tree: { root: unknown } }>) {
      const page = { slug: row.slug, name: row.slug, root: row.layout_tree.root } as Page;
      const report = scoreSlop(page);
      const mark = report.passed ? 'PASS' : 'FAIL';
      console.log(`\n${mark}  ${row.slug}`);
      for (const f of report.findings) {
        console.log(`   • [${f.check}] ${f.message}`);
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('score-slop failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
