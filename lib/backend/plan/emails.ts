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
  | { kind: 'close'; on: string }
  | { kind: 'closed' }
  | { kind: 'keep' }
  | { kind: 'upgrade'; to: string }
  | { kind: 'downgrade'; to: string; on: string }
  | { kind: 'downgrade-dropped'; stays: string }
  | { kind: 'renewed'; plan: string }
  /** Alex suspended the site (go-live step 3); `reason` is his own words. */
  | { kind: 'suspended'; reason: string }
  | { kind: 'unsuspended' }
  /** Monthly or yearly on the same plan; `on` is the renewal day it starts, or null for now. */
  | { kind: 'billing'; billing: 'monthly' | 'yearly'; on: string | null };

/** The maker's email for one change. `on` is already a long day ("Tuesday, November 18, 2026"). */
export function planChangeEmail(
  siteName: string,
  change: PlanChange,
  assetBase?: string,
): { subject: string; text: string; html: string } {
  const mail = planWords(siteName, change);
  return {
    subject: mail.subject,
    text: mail.text,
    html: renderEmail({
      heading: mail.heading,
      paragraphs: mail.text.split('\n\n'),
      button: { label: 'Open Your plan', url: PLAN_URL },
      assetBase,
    }),
  };
}

function planWords(
  siteName: string,
  change: PlanChange,
): { subject: string; heading: string; text: string } {
  switch (change.kind) {
    case 'cancel':
      return {
        subject: `${siteName}: your site will close on ${change.on}`,
        heading: 'You’re moving to Free',
        text: `You cancelled ${siteName}. Your site stays up until the end of your current term, ${change.on}. Then it comes down and you move to BohdiAI Free: nothing more is charged, and your products and tools stay. Nothing is deleted, and you can move back up any time.\n\nChanged your mind? Choose Keep my site on Your plan in your backend before ${change.on}.`,
      };
    case 'close':
      return {
        subject: `${siteName}: your account will close on ${change.on}`,
        heading: 'Your account is closing',
        text: `You chose to close your BohdiAI account for ${siteName}. Your site stays up until the end of your current term, ${change.on}. Then your account closes and everything in it is removed for good: your site, photos, products, events, sales and customers. Stripe keeps its own record of your past payments.\n\nChanged your mind? Choose Keep my account on Your plan in your backend before ${change.on}.`,
      };
    case 'closed':
      return {
        subject: `${siteName}: your account is closed`,
        heading: 'Your account is closed',
        text: `Your BohdiAI account for ${siteName} is closed, and everything in it has been removed. This is the last email you’ll get from BohdiAI. Thank you for making things with us, and good luck with your work.`,
      };
    case 'keep':
      return {
        subject: `${siteName}: your site is staying up`,
        heading: 'Your site is staying up',
        text: `You chose to keep ${siteName}. Your cancellation is withdrawn and your plan carries on as before.`,
      };
    case 'upgrade':
      return {
        subject: `${siteName}: you’re now on ${change.to}`,
        heading: `You’re now on ${change.to}`,
        text: `${siteName} moved up to ${change.to}. Everything it adds is in your backend now.`,
      };
    case 'downgrade':
      return {
        subject: `${siteName}: moving to ${change.to} on ${change.on}`,
        heading: `Moving to ${change.to}`,
        text: `${siteName} moves to ${change.to} on ${change.on}, at the end of your current term. Until then nothing changes.`,
      };
    case 'downgrade-dropped':
      return {
        subject: `${siteName}: staying on ${change.stays}`,
        heading: `Staying on ${change.stays}`,
        text: `You kept ${siteName} on ${change.stays}. The move you had waiting won’t happen.`,
      };
    case 'billing': {
      const how = change.billing === 'yearly' ? 'yearly' : 'monthly';
      return change.on === null
        ? {
            subject: `${siteName}: now billed ${how}`,
            heading: `Now billed ${how}`,
            text: `${siteName} is now billed ${how}. The unused part of your last bill counted toward this one.`,
          }
        : {
            subject: `${siteName}: billed ${how} from ${change.on}`,
            heading: `Billed ${how} from ${change.on}`,
            text: `${siteName} will be billed ${how} from ${change.on}, when your current term ends. Until then nothing changes.`,
          };
    }
    case 'suspended':
      return {
        subject: `${siteName}: your site has been suspended`,
        heading: 'Your site has been suspended',
        text: `${siteName} has been suspended, so visitors see that it’s offline for now, and you can’t put it back online yourself. This is why:\n\n${change.reason}\n\nYour plan’s billing is paused while it’s suspended, so nothing more is charged until it’s sorted out. Nothing on your site has been deleted. To talk about it, email Alex at ${SITE_CONTACT_EMAIL}.`,
      };
    case 'unsuspended':
      return {
        subject: `${siteName}: your site is back`,
        heading: 'Your site is back',
        text: `${siteName} is no longer suspended. It’s back exactly as it was before, and your plan’s billing carries on from today.`,
      };
    case 'renewed':
      return {
        subject: `${siteName}: renewed on ${change.plan}`,
        heading: `Renewed on ${change.plan}`,
        text: `${siteName} renewed on ${change.plan}.`,
      };
  }
}

/** Send the maker their email and Alex a copy. Never throws. */
export async function sendPlanChange(input: {
  siteName: string;
  subdomain: string;
  makerEmail: string;
  change: PlanChange;
}): Promise<void> {
  const mail = planChangeEmail(input.siteName, input.change);
  const sends = [
    ...(input.makerEmail === '' ? [] : [{ to: input.makerEmail, ...mail }]),
    {
      to: SITE_CONTACT_EMAIL,
      subject: `Copy: ${mail.subject}`,
      text: `${input.siteName} (${input.subdomain}.bohdiai.com), ${input.makerEmail || 'no email'}\n\n${mail.text}`,
    },
  ];
  for (const m of sends) {
    try {
      const { error } = await resend().emails.send({ from: fromEmail(), ...m });
      if (error !== null) throw new Error(error.message);
    } catch (err) {
      logger.error('plan change email failed', {
        subdomain: input.subdomain,
        kind: input.change.kind,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
