/**
 * Every email a maker can get from BohdiAI, filled in with made-up details, so Alex
 * can read them all in his admin.
 */
import { composeAuthEmail } from '@/lib/backend/auth-links';
import { planChangeEmail } from '@/lib/backend/plan/emails';
import type { IntakeWords } from '@/lib/intake/queries';
import { composeReadyEmail } from '@/lib/intake/ready-email';
import { composeConfirmEmail } from '@/lib/signup/confirm-email';
import { paidOrderEmail, soldTwiceEmail, type PaidOrderFacts } from '@/lib/square/online-emails';
import { discountEmail, freeEmail } from './invites';

export type EmailSample = { title: string; subject: string; html: string };

const LINK = 'https://app.bohdiai.com/signin';
const BUSINESS = 'Juniper Ridge Pottery';

const ORDER: PaidOrderFacts = {
  shopName: BUSINESS,
  orderNumber: '1042',
  name: 'Robin Hale',
  email: 'robin@example.com',
  phone: '401-555-0142',
  note: 'It’s a birthday present, so no price tag please.',
  lines: [
    { name: 'Speckled serving bowl', cents: 6800 },
    { name: 'Pair of mugs', cents: 4200 },
  ],
  discount: { label: 'SPRING10', cents: 1100 },
  totalCents: 9900,
  ordersUrl: 'https://app.bohdiai.com/manage/orders',
};

export function emailSamples(words: IntakeWords, assetBase: string): EmailSample[] {
  const code = {
    code: 'INVITE-SAMPLE',
    percent: 100,
    months: 3,
    name: 'Dana',
    email: 'dana@example.com',
    business: BUSINESS,
    plan: 'full' as const,
    note: '',
  };
  const samples: [string, { subject: string; html: string }][] = [
    [
      'Invite: free site',
      freeEmail({
        name: 'Dana',
        business: BUSINESS,
        plan: 'Full',
        note: 'I love your work and would be glad to have you.',
        link: LINK,
        assetBase,
      }),
    ],
    ['Invite: discount', discountEmail(code, 'https://bohdiai.com', assetBase)],
    ['Confirm their email', composeConfirmEmail({ name: 'Dana', link: LINK, words, assetBase })],
    [
      'Their site is ready',
      composeReadyEmail({
        makerName: 'Dana',
        businessName: BUSINESS,
        email: 'dana@example.com',
        words,
        assetBase,
      }),
    ],
    [
      'Reset their password',
      composeAuthEmail({ kind: 'recovery', siteName: BUSINESS, link: LINK, assetBase }),
    ],
    ['Cancelled', planChangeEmail(BUSINESS, { kind: 'cancel', on: 'December 6, 2026' }, assetBase)],
    [
      'Closing their account',
      planChangeEmail(BUSINESS, { kind: 'close', on: 'December 6, 2026' }, assetBase),
    ],
    ['Account closed', planChangeEmail(BUSINESS, { kind: 'closed' }, assetBase)],
    ['Kept their site', planChangeEmail(BUSINESS, { kind: 'keep' }, assetBase)],
    ['Moved up a plan', planChangeEmail(BUSINESS, { kind: 'upgrade', to: 'Full' }, assetBase)],
    [
      'Moving down a plan',
      planChangeEmail(
        BUSINESS,
        { kind: 'downgrade', to: 'Showcase', on: 'December 6, 2026' },
        assetBase,
      ),
    ],
    [
      'Kept their plan',
      planChangeEmail(BUSINESS, { kind: 'downgrade-dropped', stays: 'Full' }, assetBase),
    ],
    [
      'Now billed yearly',
      planChangeEmail(BUSINESS, { kind: 'billing', billing: 'yearly', on: null }, assetBase),
    ],
    [
      'Billed monthly from renewal',
      planChangeEmail(
        BUSINESS,
        { kind: 'billing', billing: 'monthly', on: 'December 6, 2026' },
        assetBase,
      ),
    ],
    [
      'Moved down at renewal',
      planChangeEmail(BUSINESS, { kind: 'renewed', plan: 'Showcase' }, assetBase),
    ],
    [
      'Site suspended',
      planChangeEmail(
        BUSINESS,
        {
          kind: 'suspended',
          reason:
            'Your shop lists vapes, which can’t be sold on BohdiAI. Take them off and I’ll put the site back.',
        },
        assetBase,
      ),
    ],
    ['Site back from suspended', planChangeEmail(BUSINESS, { kind: 'unsuspended' }, assetBase)],
    ['Paid order (Square, online shop)', paidOrderEmail(ORDER, assetBase)],
    ['Refunded: it had already sold (Square, online shop)', soldTwiceEmail(ORDER, assetBase)],
  ];
  return samples.map(([title, mail]) => ({ title, subject: mail.subject, html: mail.html }));
}
