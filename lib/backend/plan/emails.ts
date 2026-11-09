/**
 * Plan-change emails (Alex, 2026-10-19): every plan change emails the maker, and
 * Alex gets a copy, in plain text, so he always knows where each site stands. A failed
 * send is logged, never shown as a failed change: the change itself has happened.
 */
import { resend, fromEmail } from '@/lib/resend';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { logger } from '@/lib/logger';
import { renderEmail } from '@/lib/email/layout';

const PLAN_URL = 'https://app.bohdiai.com/manage/plan';

export type PlanChange =
  | { kind: 'cancel'; on: string }
  | { kind: 'keep' }
  | { kind: 'upgrade'; to: string }
  | { kind: 'downgrade'; to: string; on: string }
  | { kind: 'downgrade-dropped'; stays: string }
  | { kind: 'renewed'; plan: string }
  /** Monthly or yearly on the same plan; `on` is the renewal day it starts, or null for now. */
  | { kind: 'billing'; billing: 'monthly' | 'yearly'; on: string | null };

/** The maker's email for one change. `on` is already a long day ("Tuesday, November 18, 2026"). */
export function planChangeEmail(siteName: string, change: PlanChange, assetBase?: string): { subject: string; text: string; html: string } {
  const mail = planWords(siteName, change);
  return { subject: mail.subject, text: mail.text, html: renderEmail({ heading: mail.heading, paragraphs: mail.text.split('\n\n'), button: { label: 'Open Your plan', url: PLAN_URL }, assetBase }) };
}

function planWords(siteName: string, change: PlanChange): { subject: string; heading: string; text: string } {
  switch (change.kind) {
    case 'cancel':
      return {
        subject: `${siteName}: your site will close on ${change.on}`,
        heading: 'Your site is closing',
        text: `You cancelled ${siteName}. Your site stays up until the end of your current term, ${change.on}, and then it comes down. Nothing is deleted.\n\nChanged your mind? Choose Keep my site on Your plan in your backend before ${change.on}.`,
      };
    case 'keep':
      return { subject: `${siteName}: your site is staying up`, heading: 'Your site is staying up', text: `You chose to keep ${siteName}. Your cancellation is withdrawn and your plan carries on as before.` };
    case 'upgrade':
      return { subject: `${siteName}: you’re now on ${change.to}`, heading: `You’re now on ${change.to}`, text: `${siteName} moved up to ${change.to}. Everything it adds is in your backend now.` };
    case 'downgrade':
      return { subject: `${siteName}: moving to ${change.to} on ${change.on}`, heading: `Moving to ${change.to}`, text: `${siteName} moves to ${change.to} on ${change.on}, at the end of your current term. Until then nothing changes.` };
    case 'downgrade-dropped':
      return { subject: `${siteName}: staying on ${change.stays}`, heading: `Staying on ${change.stays}`, text: `You kept ${siteName} on ${change.stays}. The move you had waiting won’t happen.` };
    case 'billing': {
      const how = change.billing === 'yearly' ? 'yearly' : 'monthly';
      return change.on === null
        ? { subject: `${siteName}: now billed ${how}`, heading: `Now billed ${how}`, text: `${siteName} is now billed ${how}. The unused part of your last bill counted toward this one.` }
        : { subject: `${siteName}: billed ${how} from ${change.on}`, heading: `Billed ${how} from ${change.on}`, text: `${siteName} will be billed ${how} from ${change.on}, when your current term ends. Until then nothing changes.` };
    }
    case 'renewed':
      return { subject: `${siteName}: renewed on ${change.plan}`, heading: `Renewed on ${change.plan}`, text: `${siteName} renewed on ${change.plan}.` };
  }
}

/** Send the maker their email and Alex a copy. Never throws. */
export async function sendPlanChange(input: { siteName: string; subdomain: string; makerEmail: string; change: PlanChange }): Promise<void> {
  const mail = planChangeEmail(input.siteName, input.change);
  const sends = [
    ...(input.makerEmail === '' ? [] : [{ to: input.makerEmail, ...mail }]),
    { to: SITE_CONTACT_EMAIL, subject: `Copy: ${mail.subject}`, text: `${input.siteName} (${input.subdomain}.bohdiai.com), ${input.makerEmail || 'no email'}\n\n${mail.text}` },
  ];
  for (const m of sends) {
    try {
      const { error } = await resend().emails.send({ from: fromEmail(), ...m });
      if (error !== null) throw new Error(error.message);
    } catch (err) {
      logger.error('plan change email failed', { subdomain: input.subdomain, kind: input.change.kind, error: err instanceof Error ? err.message : String(err) });
    }
  }
}
