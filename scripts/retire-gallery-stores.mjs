#!/usr/bin/env node
// One-shot cleanup: unpublish any storefront whose stored archetype envelope
// names the now-deleted Gallery archetype. Sets status to 'draft' so the route
// 404s cleanly instead of resolving a deleted archetype. Idempotent.
//
// Usage: node scripts/retire-gallery-stores.mjs
//
// Reads SUPABASE_URL / SUPABASE_DB_PASSWORD from .env.local (same as db-migrate).

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
  const env = loadEnv();
  const client = new Client({ connectionString: buildConnectionString(env) });
  await client.connect();
  try {
    const { rows } = await client.query(`
      UPDATE content_pages cp
      SET status = 'draft'
      FROM tenants t
      WHERE t.id = cp.tenant_id
        AND cp.status = 'published'
        AND cp.layout_tree->'root'->>'kind' = 'archetype'
        AND cp.layout_tree->'root'->>'archetypeKey' = 'gallery'
      RETURNING t.subdomain, cp.slug;
    `);
    if (rows.length === 0) {
      console.log('No published Gallery stores found — nothing to do.');
    } else {
      console.log(`Unpublished ${rows.length} Gallery store page(s):`);
      for (const r of rows) console.log(`  - ${r.subdomain} ${r.slug}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
