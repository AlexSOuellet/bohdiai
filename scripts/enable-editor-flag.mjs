#!/usr/bin/env node
/**
 * One-shot: enable the 'editor' feature flag globally. Belt-and-braces for
 * the dev NODE_ENV bypass in lib/feature-flags.ts — if the bypass doesn't
 * fire (Turbopack quirk, mis-set env, whatever), the DB row keeps the editor
 * open. Idempotent: upserts by name.
 *
 * Usage: node --env-file=.env.local scripts/enable-editor-flag.mjs
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — run with `node --env-file=.env.local`');
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const { error } = await db
  .from('feature_flags')
  .upsert({ name: 'editor', enabled: true, allowlist: [] }, { onConflict: 'name' });

if (error) {
  console.error('upsert failed:', error.message);
  process.exit(1);
}

console.log("✓ editor feature flag is now enabled globally");
