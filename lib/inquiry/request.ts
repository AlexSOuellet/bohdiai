/**
 * bohdiai.com project inquiries — parse the JSON the contact form posts and
 * compose the email Alex receives. Pure: no IO. The route (app/api/inquiry)
 * does the limiting and the send.
 */
import { z } from 'zod';

export const INQUIRY_KINDS = ['maker', 'service', 'charity', 'other'] as const;
export type InquiryKind = (typeof INQUIRY_KINDS)[number];

export const INQUIRY_KIND_LABELS: Record<InquiryKind, string> = {
  maker: 'Maker',
  service: 'Service business',
  charity: 'Charity or cause',
  other: 'Something else',
};

const KIND_ERROR = 'Pick what kind of business you are.';
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

export const InquirySchema = z.object({
  name: z.string().trim().min(1, 'Please add your name.').max(120, 'That name is a bit long.'),
  email: z.string().trim().toLowerCase().max(254).email('That email doesn’t look right.'),
  kind: z.enum(INQUIRY_KINDS, { errorMap: () => ({ message: KIND_ERROR }) }),
  message: z
    .string()
    .trim()
    .min(1, 'Tell me a little about what you need.')
    .max(5000, 'That message is a bit long. Try trimming it down.'),
  link,
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
  });
  if (!parsed.success) return { kind: 'invalid', error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  return { kind: 'ok', fields: parsed.data };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** The email Alex gets: every answer labelled, readable on a phone. The route sets Reply-To to the visitor. */
export function composeInquiryEmail(f: InquiryFields): { subject: string; text: string; html: string } {
  const kind = INQUIRY_KIND_LABELS[f.kind];
  const subject = `New project: ${f.name} (${kind})`;
  const rows: Array<[string, string]> = [
    ['Name', f.name],
    ['Email', f.email],
    ['Business', kind],
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
