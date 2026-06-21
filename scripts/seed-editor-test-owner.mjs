#!/usr/bin/env node
/**
 * Provision a throwaway login that OWNS a test store, so the maker dashboard /
 * site editor can be exercised locally without touching a real maker's account.
 *
 * It creates (or reuses) a Supabase auth user with email confirmed, then writes
 * the `tenant_members` admin row linking that user to the given shop — the same
 * ownership row onboarding writes at publish (addShopOwner). Fully reversible:
 * delete the tenant_members row and the auth user when done.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-editor-test-owner.mjs [--subdomain soul-splatter-bright] [--email editor-test@bohdiai.com] [--password <pw>]
 *
 * Prints the final email + password to log in with at localhost:3000/signin.
 */
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

const rest = process.argv.slice(2);
function flag(name, fallback) {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : fallback;
}

const subdomain = flag('subdomain', 'soul-splatter-bright');
const email = flag('email', 'editor-test@bohdiai.com').toLowerCase();
const password = flag('password', `Test-${randomBytes(6).toString('hex')}`);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — run with `node --env-file=.env.local`');
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data: tenant, error: tErr } = await db
  .from('tenants')
  .select('id, business_name, status')
  .eq('subdomain', subdomain)
  .maybeSingle();
if (tErr || !tenant) {
  console.error(`Could not find tenant "${subdomain}":`, tErr?.message ?? 'no row');
  process.exit(1);
}

// Create the user (email pre-confirmed so no inbox round-trip), or reuse it.
let userId;
const created = await db.auth.admin.createUser({ email, password, email_confirm: true });
if (created.error) {
  if (!/already|registered|exists/i.test(created.error.message)) {
    console.error('createUser failed:', created.error.message);
    process.exit(1);
  }
  // Already exists — find the id and reset the password so the printed one works.
  const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = list?.users?.find((u) => (u.email ?? '').toLowerCase() === email);
  if (!found) {
    console.error('User exists but could not be located in the first page of users.');
    process.exit(1);
  }
  userId = found.id;
  await db.auth.admin.updateUserById(userId, { password, email_confirm: true });
} else {
  userId = created.data.user.id;
}

// Link as active admin (idempotent).
const { data: existing } = await db
  .from('tenant_members')
  .select('id')
  .eq('user_id', userId)
  .eq('tenant_id', tenant.id)
  .eq('status', 'active')
  .maybeSingle();
if (!existing) {
  const { error: insErr } = await db
    .from('tenant_members')
    .insert({ user_id: userId, tenant_id: tenant.id, role: 'admin', status: 'active' });
  if (insErr) {
    console.error('Failed to write tenant_members row:', insErr.message);
    process.exit(1);
  }
}

console.log('\n✓ Test owner ready');
console.log(`  store:    ${tenant.business_name} (${subdomain}.bohdiai.com) [${tenant.status}]`);
console.log(`  email:    ${email}`);
console.log(`  password: ${password}`);
console.log('\nLog in at http://localhost:3000/signin, then open http://localhost:3000/dashboard/website');
console.log('\nTo undo: delete the tenant_members row for this user + the auth user.');
