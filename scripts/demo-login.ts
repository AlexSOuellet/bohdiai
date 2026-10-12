/**
 * Give a demo site a shared login Alex can use in walkthroughs (Saltmarsh & Lace
 * demo spec) — Claude's tool, not a user surface. Never emails.
 *
 *   DEMO_PASSWORD=... npx tsx --env-file=.env.local scripts/demo-login.ts <subdomain> <email>
 *
 * Creates the account with that password (already confirmed) or resets the
 * password of an existing one, then makes it an admin of that one site only.
 * The password is passed in at run time and never stored in the repo.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';
import { ensureBuilderAccess } from '../lib/backend/builder-access';

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

async function main(): Promise<void> {
  const [rawSubdomain, rawEmail] = process.argv.slice(2);
  if (rawSubdomain === undefined || rawEmail === undefined) fail('usage: DEMO_PASSWORD=... demo-login.ts <subdomain> <email>');
  const subdomain = rawSubdomain.trim().toLowerCase();
  const email = rawEmail.trim().toLowerCase();
  const password = process.env['DEMO_PASSWORD'] ?? '';
  if (password.length < 8) fail('DEMO_PASSWORD must be set, at least 8 characters');
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (url === undefined || key === undefined) fail('missing SUPABASE url / service key — run with --env-file=.env.local');
  const db = createClient<Database>(url, key);

  const { data: tenant, error } = await db.from('tenants').select('id, business_name').eq('subdomain', subdomain).is('deleted_at', null).maybeSingle();
  if (error !== null) fail(`site lookup failed: ${error.message}`);
  if (tenant === null) fail(`no site "${subdomain}"`);

  const { data: existingId, error: lookupErr } = await db.rpc('auth_user_id_by_email', { p_email: email });
  if (lookupErr !== null) fail(`account lookup failed: ${lookupErr.message}`);
  if (typeof existingId === 'string') {
    const { error: upErr } = await db.auth.admin.updateUserById(existingId, { password, email_confirm: true });
    if (upErr !== null) fail(`password reset failed: ${upErr.message}`);
    process.stdout.write(`account exists: ${email} (password reset)\n`);
  } else {
    const { error: cErr } = await db.auth.admin.createUser({ email, password, email_confirm: true });
    if (cErr !== null) fail(`account create failed: ${cErr.message}`);
    process.stdout.write(`account created: ${email}\n`);
  }

  const access = await ensureBuilderAccess(db, tenant.id, email);
  if (!access.ok) fail(`site access: ${access.error}`);
  process.stdout.write(`${email} ${access.added ? 'added to' : 'already on'} ${tenant.business_name}\n`);
}

main().catch((err: unknown) => fail(`failed: ${err instanceof Error ? err.message : String(err)}`));
