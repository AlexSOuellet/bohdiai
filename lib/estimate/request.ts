/**
 * Estimate requests — parse the multipart form a contractor site posts, and
 * compose the email the business receives. Pure: no IO, so it's fully testable.
 * The route (app/api/estimate) does the tenant lookup, photo shrinking and send.
 */
import { z } from 'zod';

export const MAX_ESTIMATE_PHOTOS = 5;
export const MAX_ESTIMATE_PHOTO_BYTES = 15 * 1024 * 1024;
export const ESTIMATE_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === undefined || v === '' ? undefined : v));

export const EstimateFieldsSchema = z
  .object({
    tenantId: z.string().uuid(),
    name: z.string().trim().min(1, 'Please add your name.').max(120),
    phone: optionalText(40),
    email: optionalText(254).pipe(z.string().email('That email doesn’t look right.').optional()),
    town: optionalText(120),
    state: optionalText(60),
    details: optionalText(5000),
    services: z.array(z.string().trim().min(1).max(80)).max(20),
  })
  .refine((v) => v.phone !== undefined || v.email !== undefined, {
    message: 'Add a phone number or an email so we can reach you.',
    path: ['phone'],
  });

export type EstimateFields = z.infer<typeof EstimateFieldsSchema>;

export type ParsedEstimate =
  | { kind: 'spam' }
  | { kind: 'invalid'; error: string }
  | { kind: 'ok'; fields: EstimateFields; photos: File[] };

/** Read the form. A filled honeypot is a bot: the caller answers "ok" and sends nothing. */
export function parseEstimateForm(form: FormData): ParsedEstimate {
  const honeypot = form.get('company');
  if (typeof honeypot === 'string' && honeypot.trim() !== '') return { kind: 'spam' };

  const str = (k: string): string | undefined => {
    const v = form.get(k);
    return typeof v === 'string' ? v : undefined;
  };
  const parsed = EstimateFieldsSchema.safeParse({
    tenantId: str('tenantId'),
    name: str('name') ?? '',
    phone: str('phone'),
    email: str('email'),
    town: str('town'),
    state: str('state'),
    details: str('details'),
    services: form.getAll('services').filter((v): v is string => typeof v === 'string'),
  });
  if (!parsed.success) return { kind: 'invalid', error: parsed.error.issues[0]?.message ?? 'Please check the form.' };

  const photos = form.getAll('photos').filter((v): v is File => typeof v !== 'string' && v.size > 0);
  if (photos.length > MAX_ESTIMATE_PHOTOS) return { kind: 'invalid', error: 'Up to 5 photos, please.' };
  if (photos.some((p) => !ESTIMATE_PHOTO_TYPES.has(p.type))) return { kind: 'invalid', error: 'Photos need to be JPG, PNG, or WebP.' };
  if (photos.some((p) => p.size > MAX_ESTIMATE_PHOTO_BYTES)) return { kind: 'invalid', error: 'One of those photos is over 15MB. Try a different one.' };

  return { kind: 'ok', fields: parsed.data, photos };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** The email the business gets: every answer, labelled, easy to scan on a phone. */
export function composeEstimateEmail(f: EstimateFields, businessName: string, photoCount: number): { subject: string; text: string; html: string } {
  const where = [f.town, f.state].filter((v) => v !== undefined).join(', ');
  const subject = `Estimate request: ${f.name}${where !== '' ? ` — ${where}` : ''}`;
  const rows: Array<[string, string]> = [
    ['Name', f.name],
    ['Phone', f.phone ?? '—'],
    ['Email', f.email ?? '—'],
    ['Where', where !== '' ? where : '—'],
    ['Needs', f.services.length > 0 ? f.services.join(', ') : '—'],
    ['Photos', photoCount > 0 ? `${photoCount} attached` : 'none'],
  ];
  const text = [
    `New estimate request from your website (${businessName}).`,
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    'About the job:',
    f.details ?? '—',
  ].join('\n');
  const html = `
    <p>New estimate request from your website (${escapeHtml(businessName)}).</p>
    <table cellpadding="6" style="border-collapse:collapse">
      ${rows.map(([k, v]) => `<tr><td><strong>${escapeHtml(k)}</strong></td><td>${escapeHtml(v)}</td></tr>`).join('')}
    </table>
    <p><strong>About the job:</strong><br />${escapeHtml(f.details ?? '—').replace(/\n/g, '<br />')}</p>
  `;
  return { subject, text, html };
}
