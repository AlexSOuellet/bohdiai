/**
 * After paying (Alex, Session 119): the confirmation email, and what the check-your-
 * email screen can do. The screen names the checkout by Stripe's session id, which
 * only the maker's own browser has; the site and its owner are read from Stripe
 * and our database, never taken from the page.
 */
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { resend, fromEmail } from '@/lib/resend';
import { serverEnv } from '@/lib/env';
import { appOrigin } from '@/lib/backend/app-url';
import { getIntakeWords } from '@/lib/intake/queries';
import { EMAIL_SHAPE, INTAKE_LIMITS } from '@/lib/intake/request';
import { ownerOf, sendConfirmation, type Owner, type Send } from './confirm-email';

type Db = SupabaseClient<Database>;

const send: Send = async (msg) => {
  const { error } = await resend().emails.send({ from: fromEmail(), ...msg });
  return { error: error === null ? null : { message: error.message } };
};

/** Emails the site's owner a fresh confirmation link. siteOrigin is the address the
 *  sign-up happened on (the dev server while testing), so the link comes back there. */
export async function confirmOwner(db: Db, owner: Owner, siteOrigin: string = serverEnv().SITE_URL): Promise<void> {
  await sendConfirmation({ db, owner, appOrigin: appOrigin(siteOrigin), words: await getIntakeWords(db), send });
}

export async function confirmSite(db: Db, tenantId: string, siteOrigin?: string): Promise<void> {
  await confirmOwner(db, await ownerOf(db, tenantId), siteOrigin);
}

/** The paid checkout's site and owner, or null when it isn't a paid sign-up. */
async function paidOwner(s: Stripe, db: Db, sessionId: string): Promise<{ tenantId: string; owner: Owner; customer: string | null } | null> {
  if (!sessionId.startsWith('cs_')) return null;
  const session = await s.checkout.sessions.retrieve(sessionId);
  const tenantId = session.client_reference_id;
  if (session.status !== 'complete' || tenantId === null) return null;
  const customer = typeof session.customer === 'string' ? session.customer : (session.customer?.id ?? null);
  return { tenantId, owner: await ownerOf(db, tenantId), customer };
}

export type AgainResult = { ok: true; email: string } | { ok: false; reason: 'notFound' | 'confirmed' };

/** "Send it again". */
export async function sendAgain(s: Stripe, db: Db, sessionId: string, siteOrigin?: string): Promise<AgainResult> {
  const paid = await paidOwner(s, db, sessionId);
  if (paid === null) return { ok: false, reason: 'notFound' };
  if (paid.owner.confirmed) return { ok: false, reason: 'confirmed' };
  await confirmOwner(db, paid.owner, siteOrigin);
  return { ok: true, email: paid.owner.email };
}

export type FixResult = AgainResult | { ok: false; reason: 'email' | 'accountExists' };

/** "Wrong email?": the account, the site and Stripe take the new address, and the link goes there. */
export async function fixEmail(s: Stripe, db: Db, sessionId: string, typed: string, siteOrigin?: string): Promise<FixResult> {
  const email = typed.trim().toLowerCase();
  if (!EMAIL_SHAPE.test(email) || email.length > INTAKE_LIMITS.email) return { ok: false, reason: 'email' };
  const paid = await paidOwner(s, db, sessionId);
  if (paid === null) return { ok: false, reason: 'notFound' };
  if (paid.owner.confirmed) return { ok: false, reason: 'confirmed' };

  const { error } = await db.auth.admin.updateUserById(paid.owner.userId, { email, email_confirm: false });
  if (error !== null) {
    if (error.code === 'email_exists' || error.status === 422) return { ok: false, reason: 'accountExists' };
    throw new Error(`Could not change the email: ${error.message}`);
  }
  const { error: tErr } = await db.from('tenants').update({ contact_email: email }).eq('id', paid.tenantId);
  if (tErr !== null) throw new Error(`Could not change the site's email: ${tErr.message}`);
  if (paid.customer !== null) await s.customers.update(paid.customer, { email });
  await confirmOwner(db, { ...paid.owner, email }, siteOrigin);
  return { ok: true, email };
}
