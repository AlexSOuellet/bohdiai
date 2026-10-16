/**
 * Permanently remove the sites that are already marked deleted (Alex, 2026-10-16).
 * Alex runs this himself: it can't be undone.
 *
 *   npx tsx --env-file=.env.local scripts/purge-deleted-sites.ts          (check only: lists what goes)
 *   npx tsx --env-file=.env.local scripts/purge-deleted-sites.ts --yes    (removes them)
 *
 * Only sites with deleted_at set are touched, by id, so a live site that shares an
 * old deleted site's address is left alone. Kept on purpose: their photos (the
 * upload records and the files, reusable later) and the logged design decisions;
 * both are unlinked from the site first. Everything else that belongs only to the
 * site goes with it: pages, pieces, collections, members, words and the rest.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

async function main(): Promise<void> {
  const yes = process.argv.includes('--yes');
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (url === undefined || key === undefined) fail('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are needed (use --env-file=.env.local)');
  const db = createClient<Database>(url, key, { auth: { persistSession: false } });

  const { data: sites, error } = await db.from('tenants').select('id, subdomain, deleted_at').not('deleted_at', 'is', null).order('subdomain');
  if (error !== null) fail(`reading the deleted sites failed: ${error.message}`);
  const list = sites ?? [];
  if (list.length === 0) {
    process.stdout.write('no deleted sites\n');
    return;
  }
  for (const s of list) {
    const { count } = await db.from('listings').select('id', { count: 'exact', head: true }).eq('tenant_id', s.id);
    process.stdout.write(`${s.subdomain} (deleted ${s.deleted_at?.slice(0, 10)}): ${count ?? 0} pieces\n`);
  }
  if (!yes) {
    process.stdout.write(`\n${list.length} sites would be removed for good. Their photos and design decisions are kept.\nRun again with --yes to remove them.\n`);
    return;
  }

  let removed = 0;
  for (const s of list) {
    const keepPhotos = await db.from('uploads').update({ tenant_id: null }).eq('tenant_id', s.id);
    if (keepPhotos.error !== null) fail(`${s.subdomain}: keeping its photos failed (${keepPhotos.error.message}); stopped, nothing more removed`);
    const keepChoices = await db.from('design_choices').update({ tenant_id: null }).eq('tenant_id', s.id);
    if (keepChoices.error !== null) fail(`${s.subdomain}: keeping its design decisions failed (${keepChoices.error.message}); stopped`);
    const gone = await db.from('tenants').delete().eq('id', s.id).not('deleted_at', 'is', null);
    if (gone.error !== null) fail(`${s.subdomain}: removing it failed (${gone.error.message}); stopped after ${removed}`);
    removed += 1;
    process.stdout.write(`removed ${s.subdomain}\n`);
  }
  process.stdout.write(`\n${removed} sites removed for good.\n`);
}

void main();
