/**
 * "Report this site" (go-live step 3, Alex 2026-11-16): a link at the bottom of every
 * site opens a short page on bohdiai.com. Reports live in `site_reports`; Alex reads
 * them in his admin's Reports tab and gets an email for each.
 */
export const REPORT_REASONS = ['illegal', 'hateful', 'scam', 'mine', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export type ReportProblem = 'site' | 'reason' | 'details' | 'tooLong' | 'email';

export type ReportFields = { site: string; reason: ReportReason; details: string; email: string };

/** Field names the page posts and the route reads. */
export const REPORT_FIELD = {
  site: 'site',
  reason: 'reason',
  details: 'details',
  email: 'email',
  honeypot: 'company',
} as const;

export const DETAILS_MAX = 2000;
const EMAIL_MAX = 200;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** A site's web address name, as subdomains are made. */
const SUBDOMAIN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export const isReportReason = (v: unknown): v is ReportReason =>
  typeof v === 'string' && (REPORT_REASONS as readonly string[]).includes(v);

/** "rustic-charm", from what someone typed or the link gave: a name, a host, or a whole address. */
export function siteName(raw: string): string | null {
  const host =
    raw
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .split(/[/?#]/)[0] ?? '';
  const name = host.replace(/:\d+$/, '').replace(/\.(bohdiai\.com|localhost)$/, '');
  return SUBDOMAIN.test(name) ? name : null;
}

const text = (b: Record<string, unknown>, k: string): string => {
  const v = b[k];
  return typeof v === 'string' ? v.trim() : '';
};

/** The report as the page sent it, checked; the first thing wrong, top of the form first. */
export function parseReport(
  body: unknown,
):
  | { kind: 'ok'; fields: ReportFields }
  | { kind: 'invalid'; problem: ReportProblem }
  | { kind: 'spam' } {
  const b =
    body !== null && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  if (text(b, REPORT_FIELD.honeypot) !== '') return { kind: 'spam' };
  const site = siteName(text(b, REPORT_FIELD.site));
  if (site === null) return { kind: 'invalid', problem: 'site' };
  const reason = b[REPORT_FIELD.reason];
  if (!isReportReason(reason)) return { kind: 'invalid', problem: 'reason' };
  const details = text(b, REPORT_FIELD.details);
  if (details === '') return { kind: 'invalid', problem: 'details' };
  if (details.length > DETAILS_MAX) return { kind: 'invalid', problem: 'tooLong' };
  const email = text(b, REPORT_FIELD.email);
  if (email !== '' && (email.length > EMAIL_MAX || !EMAIL.test(email)))
    return { kind: 'invalid', problem: 'email' };
  return { kind: 'ok', fields: { site, reason, details, email: email.toLowerCase() } };
}
