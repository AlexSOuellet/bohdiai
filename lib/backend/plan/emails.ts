/**
 * Plan-change emails (Alex, 2026-10-19): every plan change emails the maker, and
 * Alex gets a copy so he always knows where each site stands. Plain text. A failed
 * send is logged, never shown as a failed change: the change itself has happened.
 */
import { resend, fromEmail } from '@/lib/resend';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { logger } from '@/lib/logger';

export type PlanChange =
  | { kind: 'cancel'; on: string }
  | { kind: 'keep' }
  | { kind: 'upgrade'; to: string }
  | { kind: 'downgrade'; to: string; on: string }
  | { kind: 'downgrade-dropped'; stays: string }
  | { kind: 'renewed'; plan: string };

/** The maker's email for one change. `on` is already a long day ("Tuesday, November 18, 2026"). */
export function planChangeEmail(siteName: string, change: PlanChange): { subject: string; text: string } {
  switch (change.kind) {
    case 'cancel':
      return {
        subject: `${siteName}: your site will close on ${change.on}`,
        text: `You cancelled ${siteName}. Your site stays up until the end of your current term, ${change.on}, and then it comes down. Nothing is deleted.\n\nChanged your mind? Choose Keep my site on Your plan in your backend before ${change.on}.`,
      };
    case 'keep':
      return { subject: `${siteName}: your site is staying up`, text: `You chose to keep ${siteName}. Your cancellation is withdrawn and your plan carries on as before.` };
    case 'upgrade':
      return { subject: `${siteName}: you’re now on ${change.to}`, text: `${siteName} moved up to ${change.to}. Everything it adds is in your backend now.` };
    case 'downgrade':
      return { subject: `${siteName}: moving to ${change.to} on ${change.on}`, text: `${siteName} moves to ${change.to} on ${change.on}, at the end of your current term. Until then nothing changes.` };
    case 'downgrade-dropped':
      return { subject: `${siteName}: staying on ${change.stays}`, text: `You kept ${siteName} on ${change.stays}. The move you had waiting won’t happen.` };
    case 'renewed':
      return { subject: `${siteName}: renewed on ${change.plan}`, text: `${siteName} renewed on ${change.plan}.` };
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
