/**
 * Create a site owner's account and email their invite (spec §1). Claude runs this
 * until Alex's admin exists.
 *   npx tsx --env-file=.env.local scripts/invite-maker.ts <subdomain> <email>
 * An email that already has an account gets a reset link instead, and is added as
 * an admin of the site if it isn't already.
 */
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import type { Database } from '../lib/database.types';
import { sendAuthLink, type AuthLinkKind } from '../lib/backend/auth-links';
import { appOrigin } from '../lib/backend/app-url';

async function main(): Promise<void> {
  const [subdomain, rawEmail] = process.argv.slice(2);
  if (subdomain === undefined || rawEmail === undefined) throw new Error('usage: invite-maker.ts <subdomain> <email>');
  const email = rawEmail.trim().toLowerCase();
  const db = createClient<Database>(process.env['SUPABASE_URL']!, process.env['SUPABASE_SERVICE_ROLE_KEY']!);
  const resend = new Resend(process.env['RESEND_API_KEY']!);
  // The display-name form ("Name <a@b>") may come through the env loader still quoted.
  const from = (process.env['RESEND_FROM_EMAIL'] ?? '').replace(/^\s*(["'])(.*)\1\s*$/, '$2');
  if (from === '') throw new Error('RESEND_FROM_EMAIL is not set');

  const { data: tenant, error } = await db.from('tenants').select('id, business_name').eq('subdomain', subdomain).is('deleted_at', null).maybeSingle();
  if (error !== null) throw new Error(error.message);
  if (tenant === null) throw new Error(`No site "${subdomain}"`);

  const { data: existingId } = await db.rpc('auth_user_id_by_email', { p_email: email });
  const kind: AuthLinkKind = typeof existingId === 'string' ? 'recovery' : 'invite';

  let userId: string | null = typeof existingId === 'string' ? existingId : null;
  await sendAuthLink({
    kind,
    email,
    siteName: tenant.business_name,
    appOrigin: appOrigin(process.env['SITE_URL']!),
    generateLink: async ({ type, email: e }) => {
      const { data, error: linkErr } = await db.auth.admin.generateLink({ type, email: e });
      if (data?.user?.id !== undefined) userId = data.user.id;
      return { data: data?.properties ? { properties: { hashed_token: data.properties.hashed_token } } : null, error: linkErr };
    },
    send: async (msg) => {
      const { error: sendErr } = await resend.emails.send({ from, ...msg });
      return { error: sendErr === null ? null : { message: sendErr.message } };
    },
  });

  if (userId === null) throw new Error('Link sent but no user id came back — check the account in Supabase');
  const { data: member } = await db.from('tenant_members').select('id').eq('user_id', userId).eq('tenant_id', tenant.id).eq('status', 'active').maybeSingle();
  if (member === null) {
    const { error: insErr } = await db.from('tenant_members').insert({ user_id: userId, tenant_id: tenant.id, role: 'admin', status: 'active' });
    if (insErr !== null) throw new Error(`Invite sent, but adding them to the site failed: ${insErr.message}`);
  }
  console.log(`${kind === 'invite' ? 'Invite' : 'Reset link'} sent to ${email} for ${tenant.business_name}.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
