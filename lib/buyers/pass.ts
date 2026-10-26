/**
 * A buyer's sign-in pass on one shop (buyer accounts, Full; Alex 2026-10-26).
 *
 * Every shop shares one sign-in system, so a buyer's password works at any
 * BohdiAI shop. The shop never keeps that system's session, though: once the
 * password checks out, the shop gives the buyer its own signed pass, good only
 * on that shop, for that buyer, until it runs out. A pass can't sign anyone in
 * to another shop or to a maker's backend, and nothing on the shop's pages can
 * read it (the cookie is httpOnly). Signed with BACKEND_SESSION_SECRET.
 */

export const BUYER_COOKIE = 'bohdi_buyer';
/** How long a pass lasts: 30 days, then the buyer signs in again. */
export const BUYER_PASS_SECONDS = 30 * 24 * 60 * 60;

const MIN_SECRET_LENGTH = 32;
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const encoder = new TextEncoder();

export type BuyerPass = { userId: string; tenantId: string; expires: number };

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

/** The secret, or null when it's missing or too short to trust (sign-in then stays closed). */
export function passSecret(value: string | undefined): string | null {
  return value !== undefined && value.length >= MIN_SECRET_LENGTH ? value : null;
}

/** The cookie value for a pass. */
export async function signPass(pass: BuyerPass, secret: string): Promise<string> {
  const payload = `${pass.userId}.${pass.tenantId}.${pass.expires}`;
  const mac = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(payload));
  return `${payload}.${toBase64Url(mac)}`;
}

/** The pass in a cookie, or null unless it is genuine, for this shop, and not run out. */
export async function readPass(value: string | undefined, tenantId: string, now: number, secret: string): Promise<BuyerPass | null> {
  if (value === undefined) return null;
  const parts = value.split('.');
  if (parts.length !== 4) return null;
  const [userId = '', forShop = '', expires = '', mac = ''] = parts;
  if (!ID.test(userId) || forShop !== tenantId || !/^\d+$/.test(expires)) return null;
  if (Number(expires) <= now) return null;
  const signature = fromBase64Url(mac);
  if (signature === null) return null;
  // subtle.verify compares in constant time.
  const genuine = await crypto.subtle.verify('HMAC', await hmacKey(secret), signature, encoder.encode(`${userId}.${forShop}.${expires}`));
  return genuine ? { userId, tenantId: forShop, expires: Number(expires) } : null;
}
