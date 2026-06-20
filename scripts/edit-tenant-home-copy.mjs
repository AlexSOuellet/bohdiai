#!/usr/bin/env node
/**
 * Reversible hand-edit of a tenant's live home-page copy, for use before the
 * maker-facing My Website editor exists. ALWAYS snapshots the current home
 * layout_tree to a timestamped JSON file under tmp/content-backups/ before
 * writing, and prints the exact --restore command to undo.
 *
 * This is intentionally a thin, auditable tool: the specific copy change lives
 * in `applyEdit()` below so the diff is reviewable. Restore is generic — it
 * writes a snapshot file's layout_tree back verbatim.
 *
 * Usage:
 *   node --env-file=.env.local scripts/edit-tenant-home-copy.mjs <subdomain> [--dry]
 *   node --env-file=.env.local scripts/edit-tenant-home-copy.mjs <subdomain> --restore <snapshot.json>
 *
 *   <subdomain>            Required. The tenant subdomain (e.g. soul-splatter).
 *   --dry                  Print the before/after without writing.
 *   --restore <file>       Write the snapshot file's layout_tree back to the
 *                          home page, undoing a prior edit. No new snapshot.
 *
 * Requires SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and
 * SUPABASE_SERVICE_ROLE_KEY in the environment.
 */
import { createClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , subdomain, ...rest] = process.argv;
if (!subdomain || subdomain.startsWith('-')) {
  console.error('usage: node --env-file=.env.local scripts/edit-tenant-home-copy.mjs <subdomain> [--dry] [--restore <file>]');
  process.exit(1);
}
const dry = rest.includes('--dry');
const restoreIdx = rest.indexOf('--restore');
const restoreFile = restoreIdx >= 0 ? rest[restoreIdx + 1] : null;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — run with `node --env-file=.env.local ...`');
  process.exit(1);
}
const db = createClient(url, serviceKey);

/**
 * The actual copy change for soul-splatter. Returns a NEW layout_tree (never
 * mutates the input). Keep edits surgical and structure-preserving.
 *
 *  - Promote the maker's real tagline "Art that moves with you" to the hero
 *    eyebrow (no terminal punctuation, per house copy style).
 *  - Save the old eyebrow ("No ink. No artist. Just living water and you.") as
 *    the opening story beat so nothing good is lost. Trailing period dropped to
 *    match the other story lines.
 */
function applyEdit(tree) {
  const next = structuredClone(tree);
  const moment = next?.root?.content?.moment;
  if (!moment) throw new Error('home envelope has no root.content.moment — wrong tenant or shape');

  const NEW_EYEBROW = 'Art that moves with you';
  const oldEyebrow = typeof moment.eyebrow === 'string' ? moment.eyebrow : '';
  const savedBeat = oldEyebrow.replace(/[.\s]+$/, ''); // drop trailing period/space

  const story = Array.isArray(moment.story) ? moment.story : [];
  // Idempotent: don't double-apply if the edit already ran.
  if (moment.eyebrow !== NEW_EYEBROW) {
    moment.eyebrow = NEW_EYEBROW;
    if (savedBeat && !story.includes(savedBeat)) story.unshift(savedBeat);
    moment.story = story;
  }
  return next;
}

async function loadHome() {
  const { data: tenant, error: tErr } = await db
    .from('tenants').select('id, subdomain').eq('subdomain', subdomain).maybeSingle();
  if (tErr) { console.error('tenant lookup failed:', tErr.message); process.exit(1); }
  if (!tenant) { console.error(`no tenant with subdomain "${subdomain}"`); process.exit(1); }

  const { data: page, error: pErr } = await db
    .from('content_pages').select('id, layout_tree')
    .eq('tenant_id', tenant.id).eq('slug', '/').eq('status', 'published').maybeSingle();
  if (pErr) { console.error('home page lookup failed:', pErr.message); process.exit(1); }
  if (!page) { console.error(`no published home page for "${subdomain}"`); process.exit(1); }
  return page;
}

if (restoreFile) {
  const snapshot = JSON.parse(readFileSync(restoreFile, 'utf8'));
  const tree = snapshot.layout_tree ?? snapshot; // accept the snapshot wrapper or a bare tree
  const page = await loadHome();
  if (dry) { console.log('--dry: would restore', restoreFile, 'to home page', page.id); process.exit(0); }
  const { error } = await db.from('content_pages').update({ layout_tree: tree }).eq('id', page.id);
  if (error) { console.error('restore failed:', error.message); process.exit(1); }
  console.log(`restored ${subdomain} home from ${restoreFile}`);
  process.exit(0);
}

const page = await loadHome();
const before = page.layout_tree;
const after = applyEdit(before);

console.log('eyebrow before:', JSON.stringify(before?.root?.content?.moment?.eyebrow));
console.log('eyebrow after: ', JSON.stringify(after?.root?.content?.moment?.eyebrow));
console.log('story after:   ', JSON.stringify(after?.root?.content?.moment?.story, null, 2));

if (dry) { console.log('--dry: not writing.'); process.exit(0); }

// Snapshot BEFORE writing — this is the revert artifact.
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const dir = join('tmp', 'content-backups');
mkdirSync(dir, { recursive: true });
const snapPath = join(dir, `${subdomain}-home-${stamp}.json`);
writeFileSync(snapPath, JSON.stringify({ subdomain, page_id: page.id, saved_at: stamp, layout_tree: before }, null, 2));
console.log(`\nsnapshot saved: ${snapPath}`);

const { error } = await db.from('content_pages').update({ layout_tree: after }).eq('id', page.id);
if (error) { console.error('update failed:', error.message); process.exit(1); }

console.log('done — reload the storefront to see the change.');
console.log(`revert with:\n  node --env-file=.env.local scripts/edit-tenant-home-copy.mjs ${subdomain} --restore ${snapPath}`);
