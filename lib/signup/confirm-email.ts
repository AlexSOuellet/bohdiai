/**
 * The email that confirms a maker's address (Alex, Session 119), sent once they've
 * paid. Its link is a one-time Supabase token to /auth/confirm on the app host,
 * which confirms the email and signs them in. Its words are the form's own.
 *
 * Sent when the payment is first recorded, again from "Send it again", to a fixed
 * address, and when a paid maker who hasn't confirmed tries to sign in.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { fill } from '@/lib/site-words/words';
import type { IntakeWords } from '@/lib/intake/queries';
import { confirmUrl } from '@/lib/backend/auth-links';

type Db = SupabaseClient<Database>;

const escapeHtml = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function composeConfirmEmail(args: { name: string; link: string; words: IntakeWords }): { subject: string; text: string; html: string } {
  const c = args.words.confirm;
  const greeting = fill(c.greeting, { name: args.name });
  const text = [greeting, '', c.body, '', `${c.button}: ${args.link}`, '', c.notYou, '', c.signoff].join('\n');
  const html = [
    `<p>${escapeHtml(greeting)}</p>`,
    `<p>${escapeHtml(c.body)}</p>`,
    `<p><a href="${escapeHtml(args.link)}">${escapeHtml(c.button)}</a></p>`,
    `<p>${escapeHtml(c.notYou)}</p>`,
    `<p>${escapeHtml(c.signoff)}</p>`,
  ].join('');
  return { subject: c.subject, text, html };
}

export type Send = (msg: { to: string; subject: string; text: string; html: string }) => Promise<{ error: { message: string } | null }>;

/** A site's owner, as sign-up made them. */
export type Owner = { userId: string; email: string; name: string; confirmed: boolean };

export async function ownerOf(db: Db, tenantId: string): Promise<Owner> {
  const { data, error } = await db.from('tenant_members').select('user_id').eq('tenant_id', tenantId).eq('role', 'admin').eq('status', 'active').limit(1).maybeSingle();
  if (error !== null) throw new Error(`Could not read the site's owner: ${error.message}`);
  if (data === null) throw new Error(`site ${tenantId} has no owner`);
  const { data: u, error: uErr } = await db.auth.admin.getUserById(data.user_id);
  if (uErr !== null) throw new Error(`Could not read the account: ${uErr.message}`);
  const meta: Record<string, unknown> = u.user.user_metadata;
  const name = meta['name'];
  return { userId: u.user.id, email: u.user.email ?? '', name: typeof name === 'string' ? name : '', confirmed: u.user.email_confirmed_at != null };
}

/** Makes a fresh link and emails it to the owner. Does nothing once they're confirmed. */
export async function sendConfirmation(args: { db: Db; owner: Owner; appOrigin: string; words: IntakeWords; send: Send }): Promise<void> {
  if (args.owner.confirmed) return;
  const { data, error } = await args.db.auth.admin.generateLink({ type: 'magiclink', email: args.owner.email });
  if (error !== null) throw new Error(`Could not make the confirmation link: ${error.message}`);
  const link = confirmUrl(args.appOrigin, data.properties.hashed_token, 'signup');
  const mail = composeConfirmEmail({ name: args.owner.name, link, words: args.words });
  const sent = await args.send({ to: args.owner.email, ...mail });
  if (sent.error !== null) throw new Error(`Could not send the confirmation email: ${sent.error.message}`);
}
