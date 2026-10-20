/**
 * The key the daily job (worker.ts) sends to /api/cron/visit-months: an HMAC of a
 * fixed name under BACKEND_SESSION_SECRET (Web Crypto, so it runs in the Worker's
 * scheduled handler and the route alike). Nothing to store, nothing new to set up.
 * Imported by worker.ts, so it uses no `@/` paths.
 */

export const CRON_KEY_HEADER = 'x-bohdi-cron';

const MIN_SECRET_LENGTH = 32;

export async function cronKey(secret: string | undefined, job: string): Promise<string | null> {
  if (secret === undefined || secret.length < MIN_SECRET_LENGTH) return null;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`cron:${job}`)));
  let hex = '';
  for (const b of mac) hex += b.toString(16).padStart(2, '0');
  return hex;
}

/** Whether `given` is the job's key, compared in constant time. */
export async function isCronKey(secret: string | undefined, job: string, given: string | null): Promise<boolean> {
  const expected = await cronKey(secret, job);
  if (expected === null || given === null || given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}
