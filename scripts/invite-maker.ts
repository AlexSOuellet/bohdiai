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
import { createAuthLink, sendAuthEmail, type AuthLinkKind } from '../lib/backend/auth-links';
import { appOrigin } from '../lib/backend/app-url';

async function main(): Promise<void> {
  const [subdomain, rawEmail] = process.argv.slice(2);
  if (subdomain === undefined || rawEmail === undefined) throw new Error('usage: invite-maker.ts <subdomain> <email>');
  const email = rawEmail.trim().toLowerCase();
  const need = (name: string): string => {
    const v = (process.env[name] ?? '').trim();
    if (v === '') throw new Error(`${name} is not set (run with --env-file=.env.local)`);
    return v;
  };
  const supabaseUrl = need('SUPABASE_URL');
  const serviceKey = need('SUPABASE_SERVICE_ROLE_KEY');
  const resendKey = need('RESEND_API_KEY');
  const siteUrl = need('SITE_URL');
  // The display-name form ("Name <a@b>") may come through the env loader still quoted.
  const from = need('RESEND_FROM_EMAIL').replace(/^\s*(["'])(.*)\1\s*$/, '$2');
  const db = createClient<Database>(supabaseUrl, serviceKey);
  const resend = new Resend(resendKey);

  const { data: tenant, error } = await db.from('tenants').select('id, business_name').eq('subdomain', subdomain).is('deleted_at', null).maybeSingle();
  if (error !== null) throw new Error(error.message);
  if (tenant === null) throw new Error(`No site "${subdomain}"`);

  const { data: existingId } = await db.rpc('auth_user_id_by_email', { p_email: email });
  const kind: AuthLinkKind = typeof existingId === 'string' ? 'recovery' : 'invite';

  // Order matters: make the link (this creates the account), add them to the site,
  // and only then email. A failure before the email leaves nothing half-sent.
  const { link, userId } = await createAuthLink({
    kind,
    email,
    appOrigin: appOrigin(siteUrl),
    generateLink: async ({ type, email: e }) => {
      const { data, error: linkErr } = await db.auth.admin.generateLink({ type, email: e });
      return {
        data: data?.properties ? { properties: { hashed_token: data.properties.hashed_token }, user: data.user } : null,
        error: linkErr,
      };
    },
  });

  const memberId = userId ?? (typeof existingId === 'string' ? existingId : null);
  if (memberId === null) throw new Error('Nothing was emailed. No user id came back — check the account in Supabase');
  const { data: member, error: memberErr } = await db.from('tenant_members').select('id').eq('user_id', memberId).eq('tenant_id', tenant.id).eq('status', 'active').maybeSingle();
  if (memberErr !== null) throw new Error(`Nothing was emailed. Adding them to the site failed: ${memberErr.message}`);
  if (member === null) {
    const { error: insErr } = await db.from('tenant_members').insert({ user_id: memberId, tenant_id: tenant.id, role: 'admin', status: 'active' });
    if (insErr !== null) throw new Error(`Nothing was emailed. Adding them to the site failed: ${insErr.message}`);
  }

  await sendAuthEmail({
    kind,
    email,
    siteName: tenant.business_name,
    link,
    send: async (msg) => {
      const { error: sendErr } = await resend.emails.send({ from, ...msg });
      return { error: sendErr === null ? null : { message: sendErr.message } };
    },
  });
  console.log(`${kind === 'invite' ? 'Invite' : 'Reset link'} sent to ${email} for ${tenant.business_name}.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
