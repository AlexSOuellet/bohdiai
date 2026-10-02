/**
 * bohdiai.com project inquiries — parse the JSON the contact form posts and
 * compose the email Alex receives. Pure: no IO. The route (app/api/inquiry)
 * does the limiting and the send.
 */
import { z } from 'zod';
import { isPlanId, planById, type PlanId } from '@/lib/site/plans';

export const INQUIRY_KINDS = ['maker', 'service', 'charity', 'other'] as const;
export type InquiryKind = (typeof INQUIRY_KINDS)[number];

export const INQUIRY_KIND_LABELS: Record<InquiryKind, string> = {
  maker: 'Maker',
  service: 'Service business',
  charity: 'Charity or cause',
  other: 'Something else',
};

export const CONTACT_METHODS = ['email', 'call', 'text'] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  email: 'Email',
  call: 'Phone call',
  text: 'Text',
};

const KIND_ERROR = 'Pick what kind of business you are.';
export const PHONE_NEEDED_ERROR = 'Add a phone number so I can call or text you.';
const PHONE_ERROR = 'That phone number doesn’t look right.';
const LINK_ERROR = 'That link doesn’t look right.';

/** Optional; "facebook.com/x" gets https:// added; only http(s) addresses with a real host pass. */
const link = z
  .string()
  .trim()
  .max(500, LINK_ERROR)
  .optional()
  .transform((v) => {
    if (v === undefined || v === '') return undefined;
    return /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`;
  })
  .refine((v) => {
    if (v === undefined) return true;
    try {
      const u = new URL(v);
      return (u.protocol === 'https:' || u.protocol === 'http:') && u.hostname.includes('.');
    } catch {
      return false;
    }
  }, LINK_ERROR);

/** Optional; free-form (people write numbers every which way), but it needs 7–15 digits. */
const phone = z
  .string()
  .trim()
  .max(40, PHONE_ERROR)
  .optional()
  .transform((v) => (v === undefined || v === '' ? undefined : v))
  .refine((v) => {
    if (v === undefined) return true;
    const digits = v.replace(/\D/g, '').length;
    return digits >= 7 && digits <= 15;
  }, PHONE_ERROR);

export const InquirySchema = z
  .object({
    name: z.string().trim().min(1, 'Please add your name.').max(120, 'That name is a bit long.'),
    email: z.string().trim().toLowerCase().max(254).email('That email doesn’t look right.'),
    kind: z.enum(INQUIRY_KINDS, { errorMap: () => ({ message: KIND_ERROR }) }),
    message: z
      .string()
      .trim()
      .min(1, 'Tell me a little about what you need.')
      .max(5000, 'That message is a bit long. Try trimming it down.'),
    link,
    phone,
    contactBy: z.enum(CONTACT_METHODS).default('email'),
    /** The plan they were looking at. A stale or unknown one is dropped, never an error. */
    plan: z
      .unknown()
      .optional()
      .transform((v): PlanId | undefined => (typeof v === 'string' && isPlanId(v) ? v : undefined)),
  })
  .refine((v) => v.contactBy === 'email' || v.phone !== undefined, {
    message: PHONE_NEEDED_ERROR,
    path: ['phone'],
  });

export type InquiryFields = z.infer<typeof InquirySchema>;

export type ParsedInquiry =
  | { kind: 'spam' }
  | { kind: 'invalid'; error: string }
  | { kind: 'ok'; fields: InquiryFields };

/** A filled honeypot (`company`) is a bot: the caller answers "ok" and sends nothing. */
export function parseInquiry(body: unknown): ParsedInquiry {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { kind: 'invalid', error: 'Please check the form.' };
  }
  const record = body as Record<string, unknown>;
  const honeypot = record['company'];
  if (typeof honeypot === 'string' && honeypot.trim() !== '') return { kind: 'spam' };

  const parsed = InquirySchema.safeParse({
    name: record['name'] ?? '',
    email: record['email'] ?? '',
    kind: record['kind'],
    message: record['message'] ?? '',
    link: record['link'],
    phone: record['phone'],
    contactBy: record['contactBy'] === '' ? undefined : record['contactBy'],
    plan: record['plan'],
  });
  if (!parsed.success)
    return { kind: 'invalid', error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  return { kind: 'ok', fields: parsed.data };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** The email Alex gets: every answer labelled, readable on a phone. The route sets Reply-To to the visitor. */
export function composeInquiryEmail(f: InquiryFields): {
  subject: string;
  text: string;
  html: string;
} {
  const kind = INQUIRY_KIND_LABELS[f.kind];
  const prefers = f.contactBy === 'email' ? '' : ` · prefers a ${f.contactBy}`;
  const planName = f.plan === undefined ? undefined : planById(f.plan).name;
  const subject = `New project: ${f.name} (${planName ?? kind})${prefers}`;
  const rows: Array<[string, string]> = [
    ['Name', f.name],
    ['Email', f.email],
    ['Phone', f.phone ?? '—'],
    ['Best way to reach', CONTACT_METHOD_LABELS[f.contactBy]],
    ['Business', kind],
    ['Plan', planName ?? 'Not chosen'],
    ['Link', f.link ?? '—'],
  ];
  const text = [
    'New project inquiry from bohdiai.com.',
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    'What they need:',
    f.message,
  ].join('\n');
  const html = `
    <p>New project inquiry from bohdiai.com.</p>
    <table cellpadding="6" style="border-collapse:collapse">
      ${rows.map(([k, v]) => `<tr><td><strong>${escapeHtml(k)}</strong></td><td>${escapeHtml(v)}</td></tr>`).join('')}
    </table>
    <p><strong>What they need:</strong><br />${escapeHtml(f.message).replace(/\n/g, '<br />')}</p>
  `;
  return { subject, text, html };
}
