/**
 * Backend auto sign-out (agreed with Alex, Session 89): makers use shared and
 * public devices, so a backend session ends after 8 hours with no activity, and
 * always 7 days after sign-in. Supabase's own session timeouts are a paid-plan
 * feature, so the app host middleware enforces both.
 *
 * The 7-day limit reads the sign-in time Supabase signs into the login token
 * (`amr`), which can't be edited. The 8-hour limit reads a "last seen" cookie
 * that is HMAC-signed and bound to the session, so it can't be hand-made to
 * dodge the limit. A missing or bad cookie counts idle time from sign-in, so
 * tampering can only make the limit stricter, never looser.
 */

export const IDLE_SECONDS = 8 * 60 * 60;
export const MAX_SECONDS = 7 * 24 * 60 * 60;
export const ACTIVITY_COOKIE = 'bk_seen';

export type SessionVerdict = 'ok' | 'idle' | 'max';
type Ended = Exclude<SessionVerdict, 'ok'>;

/** The earliest sign-in time in the token's auth methods, or null when it has none. */
export function signedInAt(claims: Record<string, unknown>): number | null {
  const amr = claims['amr'];
  if (!Array.isArray(amr)) return null;
  const times = amr
    .map((entry: unknown) => (typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>)['timestamp'] : undefined))
    .filter((t): t is number => typeof t === 'number' && Number.isFinite(t));
  return times.length === 0 ? null : Math.min(...times);
}

const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = '';
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) return null;
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

/** The cookie value recording activity at `seenAt` for this session. */
export async function signActivity(sessionId: string, seenAt: number, secret: string): Promise<string> {
  const payload = `${sessionId}.${seenAt}`;
  const mac = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(payload));
  return `${payload}.${toBase64Url(mac)}`;
}

/** The activity time in a cookie, or null unless it is genuine and for this session. */
export async function readActivity(value: string, sessionId: string, secret: string): Promise<number | null> {
  const parts = value.split('.');
  if (parts.length !== 3) return null;
  const [id = '', seen = '', mac = ''] = parts;
  if (id !== sessionId || !/^\d+$/.test(seen)) return null;
  const signature = fromBase64Url(mac);
  if (signature === null) return null;
  // subtle.verify compares in constant time.
  const genuine = await crypto.subtle.verify('HMAC', await hmacKey(secret), signature, encoder.encode(`${id}.${seen}`));
  return genuine ? Number(seen) : null;
}

/** Whether a session may continue. Activity outside [sign-in, now] doesn't count. */
export function sessionVerdict(input: { signedInAt: number; lastSeen: number; now: number }): SessionVerdict {
  const { signedInAt: start, now } = input;
  if (now - start > MAX_SECONDS) return 'max';
  const lastSeen = input.lastSeen >= start && input.lastSeen <= now ? input.lastSeen : start;
  return now - lastSeen > IDLE_SECONDS ? 'idle' : 'ok';
}

/**
 * The whole check for one backend request: the verdict, and the refreshed
 * activity cookie to set when the session continues (null when there's no
 * secret to sign it with — idle time then counts from sign-in).
 */
export async function checkBackendSession(input: {
  claims: Record<string, unknown>;
  cookie: string | undefined;
  now: number;
  secret: string | undefined;
}): Promise<{ verdict: SessionVerdict; nextCookie: string | null }> {
  const { claims, cookie, now, secret } = input;
  const start = signedInAt(claims);
  const sessionId = claims['session_id'];
  // A token we can't date or tie to a session is ended rather than trusted.
  if (start === null || typeof sessionId !== 'string' || sessionId === '') return { verdict: 'max', nextCookie: null };

  const seen = cookie !== undefined && secret !== undefined ? await readActivity(cookie, sessionId, secret) : null;
  const verdict = sessionVerdict({ signedInAt: start, lastSeen: seen ?? start, now });
  if (verdict !== 'ok' || secret === undefined) return { verdict, nextCookie: null };
  return { verdict, nextCookie: await signActivity(sessionId, now, secret) };
}

const MIN_SECRET_LENGTH = 32;

/**
 * The signing secret, or undefined when it's missing or too short to trust.
 * That is never silent: it's logged, and the backend falls back to the strict
 * rule (idle time counted from sign-in), so owners are signed out 8 hours after
 * signing in even while active.
 */
export function sessionSecret(value: string | undefined): string | undefined {
  if (value !== undefined && value.length >= MIN_SECRET_LENGTH) return value;
  console.error('[session-limits] BACKEND_SESSION_SECRET is missing or shorter than 32 characters; idle time counts from sign-in.');
  return undefined;
}

/** Why the sign-in page is showing, from its `ended` query value. */
export function endedReason(value: string | string[] | undefined): Ended | null {
  return value === 'idle' || value === 'max' ? value : null;
}
