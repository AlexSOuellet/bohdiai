/**
 * Inviting one maker (Alex, 2026-11-06). A free site skips Stripe altogether: the
 * account and the site record are made here, and the email's link, which never
 * expires, sets a password and opens the site form. A discount goes through Stripe, so the card is typed on
 * Stripe's page: the email carries a one-use code that fills itself in at sign-up.
 * Read and written with the server's own key, so only call this behind requireFounder.
 */
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { SitePlan } from '@/lib/backend/plan/plan';
import { sessionSecret } from '@/lib/backend/session-limits';
import { findUserByEmail } from '@/lib/backend/user-lookup';
import { createSite, startPlanId } from '@/lib/signup/server';
import { ownerOf } from '@/lib/signup/confirm-email';
import { createInviteCode, findInviteCodes, type Discount, type InviteCode, discountLabel } from '@/lib/billing/promos';
import { renderEmail } from '@/lib/email/layout';
import { INVITE_OPEN, inviteToken, inviteUrl } from './invite-link';
import { planName } from './sites';

type Db = SupabaseClient<Database>;
type Send = (msg: { to: string; subject: string; text: string; html: string }) => Promise<{ error: { message: string } | null }>;

export type Invitee = { name: string; email: string; business: string; plan: SitePlan; note: string };
export type InviteResult = { ok: true } | { ok: false; reason: 'exists' };
export type WaitingInvite = { key: string; kind: 'free' | 'discount'; name: string; email: string; business: string; deal: string; tenantId: string | null; code: string | null };

export function composeInviteEmail(input: { name: string; business: string; heading: string; offer: string; next: string; button: string; link: string; note: string; lasts: string; assetBase?: string | undefined }): { subject: string; text: string; html: string } {
  const greeting = `Hi ${input.name},`;
  const lines = [input.offer, ...(input.note === '' ? [] : [input.note]), input.next];
  return {
    subject: `Your BohdiAI site for ${input.business}`,
    text: [greeting, '', ...lines.flatMap((l) => [l, '']), `${input.button}: ${input.link}`, '', input.lasts, '', 'Alex'].join('\n'),
    html: renderEmail({ heading: input.heading, paragraphs: [greeting, ...lines], button: { label: input.button, url: input.link }, small: [input.lasts], assetBase: input.assetBase }),
  };
}

const freeOffer = (business: string, plan: string): string => `I’d like to give ${business} a website, free, on the ${plan} plan. There’s nothing to pay and no card to enter.`;
const FREE_NEXT = 'Set a password, tell me about your work, send a few photos, and your site builds itself. You’ll see it before anyone else does, and it only goes live when you say so.';
const discountOffer = (business: string, plan: string, deal: string): string => `I’d like to offer ${business} a website on the ${plan} plan, with ${deal}.`;
const DISCOUNT_NEXT = 'Your discount is already on the link below, so there’s no code to type. Sign up, tell me about your work, send a few photos, and your site builds itself.';

async function sendOrThrow(send: Send, to: string, mail: ReturnType<typeof composeInviteEmail>): Promise<void> {
  const sent = await send({ to, ...mail });
  if (sent.error !== null) throw new Error(`Could not send the invite: ${sent.error.message}`);
}

export function freeEmail(input: { name: string; business: string; plan: string; note: string; link: string; assetBase?: string }): ReturnType<typeof composeInviteEmail> {
  return composeInviteEmail({ name: input.name, business: input.business, heading: 'Your free site is waiting', offer: freeOffer(input.business, input.plan), next: FREE_NEXT, button: 'Set your password', link: input.link, note: input.note, lasts: 'This link is just for you, and there’s no rush: it’s good until you’ve set your password.', assetBase: input.assetBase });
}

function signingSecret(): string {
  const secret = sessionSecret(process.env['BACKEND_SESSION_SECRET']);
  if (secret === undefined) throw new Error('BACKEND_SESSION_SECRET is not set');
  return secret;
}

export async function inviteFree(db: Db, who: Invitee, appBase: string, send: Send): Promise<InviteResult> {
  if ((await findUserByEmail(who.email)) !== null) return { ok: false, reason: 'exists' };
  const { data, error } = await db.auth.admin.createUser({ email: who.email, email_confirm: true, user_metadata: { name: who.name }, app_metadata: { [INVITE_OPEN]: true } });
  if (error !== null) throw new Error(`Could not make the invite: ${error.message}`);
  const userId = data.user.id;
  let tenantId: string | null = null;
  try {
    tenantId = await createSite(db, userId, { plan: who.plan, billing: 'monthly', makerName: who.name, businessName: who.business, email: who.email, promoCode: '' });
    const { error: compErr } = await db.from('tenants').update({ plan_comp: 'free', plan_comp_note: 'Invited by Alex' }).eq('id', tenantId);
    if (compErr !== null) throw new Error(`Could not mark the site free: ${compErr.message}`);
    const link = inviteUrl(appBase, await inviteToken(signingSecret(), userId));
    await sendOrThrow(send, who.email, freeEmail({ name: who.name, business: who.business, plan: planName(who.plan), note: who.note, link }));
    return { ok: true };
  } catch (err) {
    // All or nothing: an invite that didn't go out leaves no account behind, so it can be sent again.
    if (tenantId !== null) await db.from('tenants').delete().eq('id', tenantId);
    await db.auth.admin.deleteUser(userId);
    throw err;
  }
}

export function discountEmail(code: InviteCode, siteBase: string, assetBase?: string): ReturnType<typeof composeInviteEmail> {
  const link = `${siteBase}/start?plan=${startPlanId({ plan: code.plan })}&code=${code.code}`;
  return composeInviteEmail({ name: code.name, business: code.business, heading: 'An offer just for you', offer: discountOffer(code.business, planName(code.plan), discountLabel(code).toLowerCase()), next: DISCOUNT_NEXT, button: 'Get started', link, note: code.note, lasts: 'This offer is just for you and can be used once.', assetBase });
}

export async function inviteDiscount(s: Stripe, who: Invitee, discount: Discount, siteBase: string, send: Send): Promise<InviteResult> {
  if ((await findUserByEmail(who.email)) !== null) return { ok: false, reason: 'exists' };
  const code = await createInviteCode(s, who, discount);
  await sendOrThrow(send, who.email, discountEmail(code, siteBase));
  return { ok: true };
}

/** Invites nobody has acted on: a free site with no form sent, or a code nobody has used.
 *  Free invites never touch Stripe, so with no Stripe there are just no codes to list. */
export async function loadWaitingInvites(s: Stripe | null, db: Db): Promise<WaitingInvite[]> {
  const [sites, sent, codes] = await Promise.all([db.from('tenants').select('id, business_name').eq('status', 'draft').eq('plan_comp', 'free').is('deleted_at', null), db.from('intakes').select('tenant_id'), s === null ? [] : findInviteCodes(s, db)]);
  if (sites.error !== null) throw new Error(`Could not read the invites: ${sites.error.message}`);
  if (sent.error !== null) throw new Error(`Could not read the site forms: ${sent.error.message}`);
  const done = new Set(sent.data.map((r) => r.tenant_id));
  const free = await Promise.all(
    sites.data
      .filter((t) => !done.has(t.id))
      .map(async (t): Promise<WaitingInvite> => {
        const owner = await ownerOf(db, t.id);
        return { key: t.id, kind: 'free', name: owner.name, email: owner.email, business: t.business_name, deal: 'Free site', tenantId: t.id, code: null };
      }),
  );
  return [...free, ...codes.map((c): WaitingInvite => ({ key: c.code, kind: 'discount', name: c.name, email: c.email, business: c.business, deal: discountLabel(c), tenantId: null, code: c.code }))];
}

/** The invite again, the same link. Once they've set a password there's nothing to send: they just sign in. */
export async function resendFree(db: Db, tenantId: string, appBase: string, send: Send): Promise<'sent' | 'started'> {
  const owner = await ownerOf(db, tenantId);
  const { data: account, error: accountErr } = await db.auth.admin.getUserById(owner.userId);
  if (accountErr !== null) throw new Error(`Could not read the account: ${accountErr.message}`);
  if (account.user.app_metadata[INVITE_OPEN] !== true) return 'started';
  const { data: site, error: siteErr } = await db.from('tenants').select('business_name, plan').eq('id', tenantId).single();
  if (siteErr !== null) throw new Error(`Could not read the site: ${siteErr.message}`);
  const link = inviteUrl(appBase, await inviteToken(signingSecret(), owner.userId));
  await sendOrThrow(send, owner.email, freeEmail({ name: owner.name, business: site.business_name, plan: planName(site.plan), note: '', link }));
  return 'sent';
}

export async function resendDiscount(s: Stripe, db: Db, code: string, siteBase: string, send: Send): Promise<void> {
  const invite = (await findInviteCodes(s, db)).find((c) => c.code === code);
  if (invite === undefined) throw new Error(`no waiting invite for ${code}`);
  await sendOrThrow(send, invite.email, discountEmail(invite, siteBase));
}
