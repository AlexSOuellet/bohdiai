/**
 * Every email a maker can get from BohdiAI, filled in with made-up details, so Alex
 * can read them all in his admin.
 */
import { composeAuthEmail } from '@/lib/backend/auth-links';
import { planChangeEmail } from '@/lib/backend/plan/emails';
import type { IntakeWords } from '@/lib/intake/queries';
import { composeReadyEmail } from '@/lib/intake/ready-email';
import { composeConfirmEmail } from '@/lib/signup/confirm-email';
import { discountEmail, freeEmail } from './invites';

export type EmailSample = { title: string; subject: string; html: string };

const LINK = 'https://app.bohdiai.com/signin';
const BUSINESS = 'Juniper Ridge Pottery';

export function emailSamples(words: IntakeWords, assetBase: string): EmailSample[] {
  const code = { code: 'INVITE-SAMPLE', percent: 100, months: 3, name: 'Dana', email: 'dana@example.com', business: BUSINESS, plan: 'full' as const, note: '' };
  const samples: [string, { subject: string; html: string }][] = [
    ['Invite: free site', freeEmail({ name: 'Dana', business: BUSINESS, plan: 'Full', note: 'I love your work and would be glad to have you.', link: LINK, assetBase })],
    ['Invite: discount', discountEmail(code, 'https://bohdiai.com', assetBase)],
    ['Confirm their email', composeConfirmEmail({ name: 'Dana', link: LINK, words, assetBase })],
    ['Their site is ready', composeReadyEmail({ makerName: 'Dana', businessName: BUSINESS, email: 'dana@example.com', words, assetBase })],
    ['Reset their password', composeAuthEmail({ kind: 'recovery', siteName: BUSINESS, link: LINK, assetBase })],
    ['Cancelled', planChangeEmail(BUSINESS, { kind: 'cancel', on: 'December 6, 2026' }, assetBase)],
    ['Kept their site', planChangeEmail(BUSINESS, { kind: 'keep' }, assetBase)],
    ['Moved up a plan', planChangeEmail(BUSINESS, { kind: 'upgrade', to: 'Full' }, assetBase)],
    ['Moving down a plan', planChangeEmail(BUSINESS, { kind: 'downgrade', to: 'Showcase', on: 'December 6, 2026' }, assetBase)],
  ];
  return samples.map(([title, mail]) => ({ title, subject: mail.subject, html: mail.html }));
}
