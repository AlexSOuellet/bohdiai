/**
 * Inviting one maker (Alex, 2026-11-06). A free site skips Stripe altogether: the
 * account and the site record are made here, and the email's link sets a password
 * and opens the site form. A discount goes through Stripe, so the card is typed on
 * Stripe's page: the email carries a one-use code that fills itself in at sign-up.
 * Read and written with the server's own key, so only call this behind requireFounder.
 */
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { SitePlan } from '@/lib/backend/plan/plan';
import { confirmUrl } from '@/lib/backend/auth-links';
import { findUserByEmail } from '@/lib/backend/user-lookup';
import { createSite, startPlanId } from '@/lib/signup/server';
import { ownerOf } from '@/lib/signup/confirm-email';
import { createInviteCode, findInviteCodes, type Discount, type InviteCode, discountLabel } from '@/lib/billing/promos';
import { planName } from './sites';

type Db = SupabaseClient<Database>;
type Send = (msg: { to: string; subject: string; text: string; html: string }) => Promise<{ error: { message: string } | null }>;

export type Invitee = { name: string; email: string; business: string; plan: SitePlan; note: string };
export type InviteResult = { ok: true } | { ok: false; reason: 'exists' };
export type WaitingInvite = { key: string; kind: 'free' | 'discount'; name: string; email: string; business: string; deal: string; tenantId: string | null; code: string | null };

const escapeHtml = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function composeInviteEmail(input: { name: string; business: string; offer: string; button: string; link: string; note: string; lasts: string }): { subject: string; text: string; html: string } {
  const greeting = `Hi ${input.name},`;
  const lines = [input.offer, ...(input.note === '' ? [] : [input.note])];
  return {
    subject: `Your BohdiAI site for ${input.business}`,
    text: [greeting, '', ...lines.flatMap((l) => [l, '']), `${input.button}: ${input.link}`, '', input.lasts, '', 'Alex'].join('\n'),
    html: [`<p>${escapeHtml(greeting)}</p>`, ...lines.map((l) => `<p>${escapeHtml(l)}</p>`), `<p><a href="${escapeHtml(input.link)}">${escapeHtml(input.button)}</a></p>`, `<p>${escapeHtml(input.lasts)}</p>`, '<p>Alex</p>'].join(''),
  };
}

const freeOffer = (business: string, plan: string): string => `I’d like to give you a free BohdiAI site for ${business}, on the ${plan} plan. There’s nothing to pay and no card to enter. Set a password, tell me about your work, and your site builds itself.`;
const discountOffer = (business: string, plan: string, deal: string): string => `I’d like to offer you a BohdiAI site for ${business}, on the ${plan} plan, with ${deal}. Your discount is already on the link below.`;

async function sendOrThrow(send: Send, to: string, mail: ReturnType<typeof composeInviteEmail>): Promise<void> {
  const sent = await send({ to, ...mail });
  if (sent.error !== null) throw new Error(`Could not send the invite: ${sent.error.message}`);
}

function freeEmail(input: { name: string; business: string; plan: string; note: string; link: string }): ReturnType<typeof composeInviteEmail> {
  return composeInviteEmail({ name: input.name, business: input.business, offer: freeOffer(input.business, input.plan), button: 'Set your password', link: input.link, note: input.note, lasts: 'This link lasts 24 hours and works once. If it runs out, just ask me for a new one.' });
}

export async function inviteFree(db: Db, who: Invitee, appBase: string, send: Send): Promise<InviteResult> {
  if ((await findUserByEmail(who.email)) !== null) return { ok: false, reason: 'exists' };
  const { data, error } = await db.auth.admin.generateLink({ type: 'invite', email: who.email, options: { data: { name: who.name } } });
  if (error !== null) throw new Error(`Could not make the invite: ${error.message}`);
  const userId = data.user.id;
  let tenantId: string | null = null;
  try {
    tenantId = await createSite(db, userId, { plan: who.plan, billing: 'monthly', makerName: who.name, businessName: who.business, email: who.email, promoCode: '' });
    const { error: compErr } = await db.from('tenants').update({ plan_comp: 'free', plan_comp_note: 'Invited by Alex' }).eq('id', tenantId);
    if (compErr !== null) throw new Error(`Could not mark the site free: ${compErr.message}`);
    const link = confirmUrl(appBase, data.properties.hashed_token, 'invite');
    await sendOrThrow(send, who.email, freeEmail({ name: who.name, business: who.business, plan: planName(who.plan), note: who.note, link }));
    return { ok: true };
  } catch (err) {
    // All or nothing: an invite that didn't go out leaves no account behind, so it can be sent again.
    if (tenantId !== null) await db.from('tenants').delete().eq('id', tenantId);
    await db.auth.admin.deleteUser(userId);
    throw err;
  }
}

function discountEmail(code: InviteCode, siteBase: string): ReturnType<typeof composeInviteEmail> {
  const link = `${siteBase}/start?plan=${startPlanId({ plan: code.plan })}&code=${code.code}`;
  return composeInviteEmail({ name: code.name, business: code.business, offer: discountOffer(code.business, planName(code.plan), discountLabel(code)), button: 'Get started', link, note: code.note, lasts: 'This offer is just for you and can be used once.' });
}

export async function inviteDiscount(s: Stripe, who: Invitee, discount: Discount, siteBase: string, send: Send): Promise<InviteResult> {
  if ((await findUserByEmail(who.email)) !== null) return { ok: false, reason: 'exists' };
  const code = await createInviteCode(s, who, discount);
  await sendOrThrow(send, who.email, discountEmail(code, siteBase));
  return { ok: true };
}

/** Invites nobody has acted on: a free site with no form sent, or a code nobody has used. */
export async function loadWaitingInvites(s: Stripe, db: Db): Promise<WaitingInvite[]> {
  const [sites, sent, codes] = await Promise.all([db.from('tenants').select('id, business_name').eq('status', 'draft').eq('plan_comp', 'free').is('deleted_at', null), db.from('intakes').select('tenant_id'), findInviteCodes(s, db)]);
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

/** A fresh link for a free site. An invite link can't be made twice for one account, so this is a password link. */
export async function resendFree(db: Db, tenantId: string, appBase: string, send: Send): Promise<void> {
  const owner = await ownerOf(db, tenantId);
  const { data: site, error: siteErr } = await db.from('tenants').select('business_name, plan').eq('id', tenantId).single();
  if (siteErr !== null) throw new Error(`Could not read the site: ${siteErr.message}`);
  const { data, error } = await db.auth.admin.generateLink({ type: 'recovery', email: owner.email });
  if (error !== null) throw new Error(`Could not make the link: ${error.message}`);
  const link = confirmUrl(appBase, data.properties.hashed_token, 'recovery');
  await sendOrThrow(send, owner.email, freeEmail({ name: owner.name, business: site.business_name, plan: planName(site.plan), note: '', link }));
}

export async function resendDiscount(s: Stripe, db: Db, code: string, siteBase: string, send: Send): Promise<void> {
  const invite = (await findInviteCodes(s, db)).find((c) => c.code === code);
  if (invite === undefined) throw new Error(`no waiting invite for ${code}`);
  await sendOrThrow(send, invite.email, discountEmail(invite, siteBase));
}
