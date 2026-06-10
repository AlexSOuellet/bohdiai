#!/usr/bin/env node
// Regenerate lib/database.types.ts from the live linked Postgres database.
//
// Uses the Supabase CLI's API-based `gen types typescript --project-id <ref>`
// against the public schema. The project ref is read from the CLI's own
// linked-project state (supabase/.temp/linked-project.json). This path talks to
// the Supabase API using the CLI's stored auth (from a prior `supabase login`),
// so it needs neither Docker (which the --db-url path requires for a local
// postgres-meta container) nor the DB password.
//
// This is the canonical way to refresh the generated types — run it after any
// migration that adds/changes tables or columns, then delete any temporary
// `as unknown as` casts that worked around stale types.
//
// Usage:
//   node scripts/gen-types.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const outPath = path.join(repoRoot, 'lib', 'database.types.ts');

function linkedProjectRef() {
  const statePath = path.join(repoRoot, 'supabase', '.temp', 'linked-project.json');
  if (!fs.existsSync(statePath)) {
    throw new Error('supabase/.temp/linked-project.json not found — run `supabase link` first.');
  }
  const ref = JSON.parse(fs.readFileSync(statePath, 'utf8')).ref;
  if (!ref) throw new Error('No project ref in linked-project.json.');
  return ref;
}

function main() {
  const ref = linkedProjectRef();

  // Run through a shell so the platform resolves the right npx binary
  // (npx.cmd under PowerShell/cmd, npx under POSIX). `ref` comes from the CLI's
  // own trusted state file, so there's no untrusted input in the command line.
  const result = spawnSync(
    `npx supabase gen types typescript --project-id ${ref} --schema public`,
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, shell: true },
  );

  if (result.status !== 0) {
    process.stderr.write(result.stderr || 'supabase gen types failed\n');
    process.exit(result.status ?? 1);
  }

  const types = result.stdout;
  if (!types || !types.includes('export type Database')) {
    throw new Error('Unexpected gen-types output — refusing to overwrite database.types.ts');
  }

  fs.writeFileSync(outPath, types, 'utf8');
  console.log(`Wrote ${path.relative(repoRoot, outPath)} (${types.length} bytes).`);
}

main();
