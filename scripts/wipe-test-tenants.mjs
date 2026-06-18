#!/usr/bin/env node
// One-shot wipe of every active test tenant. Soft-deletes the row (sets
// deleted_at = now() + updated_at). The subdomain resolver matches
// `status='active' AND deleted_at IS NULL`, so a wiped tenant immediately
// stops resolving — the storefront 404s. The row + storage stay (per the
// keep-images-as-library decision), so a future rebuild on the same
// subdomain can reuse what was generated.
//
// Usage:
//   node scripts/wipe-test-tenants.mjs            # dry-run, list what would wipe
//   node scripts/wipe-test-tenants.mjs --apply    # actually soft-delete
//
// Reads SUPABASE_URL / SUPABASE_DB_PASSWORD from .env.local.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function loadEnv() {
  const raw = fs.readFileSync(path.join(repoRoot, '.env.local'), 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

function buildConnectionString(env) {
  if (env.SUPABASE_DB_URL) return env.SUPABASE_DB_URL;
  const url = env.SUPABASE_URL;
  const password = env.SUPABASE_DB_PASSWORD;
  if (!url) throw new Error('SUPABASE_URL not set in .env.local');
  if (!password) throw new Error('SUPABASE_DB_PASSWORD not set in .env.local');
  const ref = new URL(url).hostname.split('.')[0];
  return `postgres://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const env = loadEnv();
  const client = new Client({ connectionString: buildConnectionString(env) });
  await client.connect();
  try {
    const { rows: targets } = await client.query(
      `SELECT subdomain, business_name FROM tenants
       WHERE status = 'active' AND deleted_at IS NULL
       ORDER BY created_at DESC`,
    );
    if (targets.length === 0) {
      console.log('No active tenants found — nothing to wipe.');
      return;
    }
    console.log(`${apply ? 'Wiping' : 'Would wipe'} ${targets.length} active tenant(s):`);
    for (const t of targets) console.log(`  - ${t.subdomain} (${t.business_name})`);
    if (!apply) {
      console.log('\nDry-run. Re-run with --apply to soft-delete (sets deleted_at).');
      return;
    }
    const { rowCount } = await client.query(
      `UPDATE tenants SET deleted_at = now(), updated_at = now()
       WHERE status = 'active' AND deleted_at IS NULL`,
    );
    console.log(`\nSoft-deleted ${rowCount} tenant(s). Rows + storage kept; resolver no longer sees them.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
