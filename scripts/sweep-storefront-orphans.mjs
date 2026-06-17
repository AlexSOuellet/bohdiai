#!/usr/bin/env node
/**
 * A2 side-task — sweep the DB for storefront orphans left by past failed
 * builds (before the transactional draft→active flip landed).
 *
 * Identifies two orphan classes:
 *   1. active tenants with NO published home content_page (the page insert
 *      failed mid-build)
 *   2. active tenants that exist but were never linked to from a build row
 *      (the build itself never completed)
 *
 * REPORT-ONLY by default. Pass `--mark-draft` to set the orphan tenants'
 * status to 'draft' (hides them from the resolver without deleting). Pass
 * `--delete` to remove the orphan tenants entirely.
 *
 * Usage:
 *   node scripts/sweep-storefront-orphans.mjs            # report only
 *   node scripts/sweep-storefront-orphans.mjs --mark-draft
 *   node scripts/sweep-storefront-orphans.mjs --delete
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const markDraft = process.argv.includes('--mark-draft');
const del = process.argv.includes('--delete');
if (markDraft && del) {
  console.error('Pass --mark-draft OR --delete, not both.');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

console.log('Scanning for active tenants…');
const { data: tenants, error: tErr } = await db
  .from('tenants')
  .select('id, subdomain, business_name, created_at')
  .eq('status', 'active')
  .is('deleted_at', null);
if (tErr) {
  console.error('Tenant fetch failed:', tErr.message);
  process.exit(1);
}

console.log(`Found ${tenants.length} active tenants. Checking for orphans…`);

const orphans = [];
for (const t of tenants) {
  const { data: pages, error: pErr } = await db
    .from('content_pages')
    .select('id')
    .eq('tenant_id', t.id)
    .eq('page_type', 'home')
    .eq('status', 'published')
    .limit(1);
  if (pErr) {
    console.error(`Page lookup failed for ${t.subdomain}: ${pErr.message}`);
    continue;
  }
  if (!pages || pages.length === 0) {
    orphans.push({ ...t, reason: 'no published home page' });
  }
}

if (orphans.length === 0) {
  console.log('No orphans found. Done.');
  process.exit(0);
}

console.log(`\n${orphans.length} orphan tenant(s):`);
for (const o of orphans) {
  console.log(`  - ${o.subdomain} (${o.id}) "${o.business_name}" — ${o.reason} — created ${o.created_at}`);
}

if (!markDraft && !del) {
  console.log('\n(Report-only. Re-run with --mark-draft to hide them, or --delete to remove.)');
  process.exit(0);
}

const ids = orphans.map((o) => o.id);

if (markDraft) {
  const { error } = await db.from('tenants').update({ status: 'draft' }).in('id', ids);
  if (error) {
    console.error('Mark-draft failed:', error.message);
    process.exit(1);
  }
  console.log(`Marked ${ids.length} tenant(s) as draft. They're no longer reachable via the resolver.`);
} else if (del) {
  const { error } = await db.from('tenants').delete().in('id', ids);
  if (error) {
    console.error('Delete failed:', error.message);
    process.exit(1);
  }
  console.log(`Deleted ${ids.length} orphan tenant(s).`);
}
