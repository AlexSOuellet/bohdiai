import { z } from 'zod';

/**
 * The "free tips and tricks" newsletter signup. Subscribers go to Alex's
 * beehiiv publication. Parsing is pure; `subscribe` takes its fetch and keys
 * as arguments so tests never touch the network.
 */

export const NEWSLETTER_SOURCE = 'maker-checkup';

const EmailSchema = z.string().trim().toLowerCase().email('That email doesn’t look right. Please check it.');

export type ParsedSignup = { kind: 'ok'; email: string } | { kind: 'spam' } | { kind: 'invalid'; error: string };

/** A filled honeypot (`company`) is a bot: answer "ok" and subscribe nobody. */
export function parseSignup(body: unknown): ParsedSignup {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { kind: 'invalid', error: 'Please enter your email.' };
  }
  const record = body as Record<string, unknown>;
  const honeypot = record['company'];
  if (typeof honeypot === 'string' && honeypot.trim() !== '') return { kind: 'spam' };
  const email = record['email'];
  if (typeof email !== 'string' || email.trim() === '') return { kind: 'invalid', error: 'Please enter your email.' };
  const parsed = EmailSchema.safeParse(email);
  if (!parsed.success) return { kind: 'invalid', error: parsed.error.issues[0]?.message ?? 'Please check your email.' };
  return { kind: 'ok', email: parsed.data };
}

export interface BeehiivConfig {
  readonly apiKey: string;
  readonly publicationId: string;
}

/** The beehiiv keys from the environment, or null when they aren't set. */
export function beehiivConfig(env: Readonly<Record<string, string | undefined>>): BeehiivConfig | null {
  const apiKey = env['BEEHIIV_API_KEY']?.trim();
  const publicationId = env['BEEHIIV_PUBLICATION_ID']?.trim();
  if (apiKey === undefined || apiKey === '' || publicationId === undefined || publicationId === '') return null;
  return { apiKey, publicationId };
}

export type SubscribeResult = { ok: true } | { ok: false; status: number; detail: string };

/** Adds `email` to the publication. beehiiv treats an existing subscriber as success. */
export async function subscribe(
  email: string,
  config: BeehiivConfig,
  fetcher: typeof fetch = fetch,
): Promise<SubscribeResult> {
  const res = await fetcher(`https://api.beehiiv.com/v2/publications/${config.publicationId}/subscriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      reactivate_existing: false,
      send_welcome_email: true,
      utm_source: NEWSLETTER_SOURCE,
      referring_site: 'https://bohdiai.com/checkup',
    }),
  });
  if (res.ok) return { ok: true };
  const detail = await res.text().catch(() => '');
  return { ok: false, status: res.status, detail: detail.slice(0, 300) };
}
