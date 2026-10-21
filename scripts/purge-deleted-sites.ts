/**
 * Permanently remove the sites that are already marked deleted, and everything
 * that was theirs (Alex, 2026-10-16: "we do not need to keep anything from deleted
 * sites"). Alex runs this himself: it can't be undone.
 *
 *   npx tsx --env-file=.env.local scripts/purge-deleted-sites.ts          (check only: lists what goes)
 *   npx tsx --env-file=.env.local scripts/purge-deleted-sites.ts --yes    (removes them)
 *
 * Only sites with deleted_at set are touched, by id, so a live site that shares an
 * old deleted site's address is left alone. For each: its photo files in storage,
 * then the site itself, which takes every row that belongs to it (pages, pieces,
 * collections, photo records, members, words, logged design decisions...).
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

  const files = new Map<string, { bucket: string; path: string }[]>();
  for (const s of list) {
    const { count } = await db.from('listings').select('id', { count: 'exact', head: true }).eq('tenant_id', s.id);
    const { data: ups, error: upErr } = await db.from('uploads').select('storage_bucket, storage_path').eq('tenant_id', s.id);
    if (upErr !== null) fail(`${s.subdomain}: reading its photos failed: ${upErr.message}`);
    files.set(s.id, (ups ?? []).map((u) => ({ bucket: u.storage_bucket, path: u.storage_path })));
    process.stdout.write(`${s.subdomain} (deleted ${s.deleted_at?.slice(0, 10)}): ${count ?? 0} pieces, ${files.get(s.id)?.length ?? 0} photos\n`);
  }
  if (!yes) {
    process.stdout.write(`\n${list.length} sites, and everything that was theirs, would be removed for good.\nRun again with --yes to remove them.\n`);
    return;
  }

  // These hold on to photo records, which can't go while anything points at them
  // (a copy of a site points at the original's), so every deleted site's go first;
  // everything else goes with the site itself.
  const ids = list.map((s) => s.id);
  for (const table of ['gallery_items', 'site_moment_photos', 'site_scenes'] as const) {
    const held = await db.from(table).delete().in('tenant_id', ids);
    if (held.error !== null) fail(`removing the deleted sites' ${table} failed (${held.error.message}); nothing else was removed`);
  }

  let removed = 0;
  for (const s of list) {
    const byBucket = new Map<string, string[]>();
    for (const f of files.get(s.id) ?? []) byBucket.set(f.bucket, [...(byBucket.get(f.bucket) ?? []), f.path]);
    for (const [bucket, paths] of byBucket) {
      const { error: rmErr } = await db.storage.from(bucket).remove(paths);
      if (rmErr !== null) fail(`${s.subdomain}: removing its photo files failed (${rmErr.message}); stopped after ${removed}`);
    }
    const gone = await db.from('tenants').delete().eq('id', s.id).not('deleted_at', 'is', null);
    if (gone.error !== null) fail(`${s.subdomain}: removing it failed (${gone.error.message}); stopped after ${removed}`);
    removed += 1;
    process.stdout.write(`removed ${s.subdomain}\n`);
  }
  process.stdout.write(`\n${removed} sites removed for good.\n`);
}

void main();
