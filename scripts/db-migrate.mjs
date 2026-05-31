#!/usr/bin/env node
// Apply pending Supabase migrations to the linked Postgres database.
//
// Reads SUPABASE_URL and SUPABASE_DB_PASSWORD from .env.local, builds the
// pooled connection string, then runs every .sql file under supabase/migrations
// that hasn't already been recorded in the _migrations tracking table.
//
// Usage:
//   node scripts/db-migrate.mjs            # apply all pending
//   node scripts/db-migrate.mjs --status   # list applied vs pending
//   node scripts/db-migrate.mjs --file <name>   # apply a single file by exact name
//   node scripts/db-migrate.mjs --mark-applied <name>   # record as applied without running (for migrations applied out-of-band)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const migrationsDir = path.join(repoRoot, 'supabase', 'migrations');

function loadEnv() {
  const envPath = path.join(repoRoot, '.env.local');
  const raw = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

function buildConnectionString(env) {
  const url = env.SUPABASE_URL;
  const password = env.SUPABASE_DB_PASSWORD;
  if (!url) throw new Error('SUPABASE_URL not set in .env.local');
  if (!password) throw new Error('SUPABASE_DB_PASSWORD not set in .env.local');
  // Allow override if dashboard provides a different connection string.
  if (env.SUPABASE_DB_URL) return env.SUPABASE_DB_URL;
  const ref = new URL(url).hostname.split('.')[0];
  // Direct connection (no region hardcoded). Works for migrations from anywhere.
  return `postgres://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
}

async function ensureMigrationsTable(client) {
  await client.query(`
    create table if not exists _migrations (
      name        text primary key,
      applied_at  timestamptz not null default now()
    );
  `);
}

async function getApplied(client) {
  const { rows } = await client.query('select name from _migrations order by name');
  return new Set(rows.map((r) => r.name));
}

function listMigrationFiles() {
  if (!fs.existsSync(migrationsDir)) return [];
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

async function applyMigration(client, file) {
  const fullPath = path.join(migrationsDir, file);
  const sql = fs.readFileSync(fullPath, 'utf8');
  process.stdout.write(`→ applying ${file} ... `);
  await client.query('begin');
  try {
    await client.query(sql);
    await client.query('insert into _migrations (name) values ($1)', [file]);
    await client.query('commit');
    console.log('ok');
  } catch (err) {
    await client.query('rollback');
    console.log('FAILED');
    throw err;
  }
}

async function main() {
  const env = loadEnv();
  const connStr = buildConnectionString(env);

  const args = process.argv.slice(2);
  const statusOnly = args.includes('--status');
  const fileFlagIdx = args.indexOf('--file');
  const onlyFile = fileFlagIdx >= 0 ? args[fileFlagIdx + 1] : null;
  const markIdx = args.indexOf('--mark-applied');
  const markFile = markIdx >= 0 ? args[markIdx + 1] : null;

  const client = new Client({ connectionString: connStr });
  await client.connect();

  try {
    await ensureMigrationsTable(client);
    const applied = await getApplied(client);
    const all = listMigrationFiles();
    const pending = all.filter((f) => !applied.has(f));

    if (markFile) {
      if (!listMigrationFiles().includes(markFile)) {
        throw new Error(`Migration file not found: ${markFile}`);
      }
      await client.query('insert into _migrations (name) values ($1) on conflict do nothing', [
        markFile,
      ]);
      console.log(`Marked applied: ${markFile}`);
      return;
    }

    if (statusOnly) {
      console.log('Applied:');
      for (const f of all.filter((f) => applied.has(f))) console.log('  ✓', f);
      console.log('Pending:');
      for (const f of pending) console.log('  ·', f);
      return;
    }

    if (onlyFile) {
      if (!all.includes(onlyFile)) {
        throw new Error(`Migration not found: ${onlyFile}`);
      }
      if (applied.has(onlyFile)) {
        console.log(`Already applied: ${onlyFile}`);
        return;
      }
      await applyMigration(client, onlyFile);
      return;
    }

    if (pending.length === 0) {
      console.log('No pending migrations.');
      return;
    }

    console.log(`${pending.length} pending migration(s).`);
    for (const f of pending) {
      await applyMigration(client, f);
    }
    console.log('All migrations applied.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('\nMigration failed:', err.message);
  if (err.detail) console.error('Detail:', err.detail);
  if (err.hint) console.error('Hint:', err.hint);
  process.exit(1);
});
