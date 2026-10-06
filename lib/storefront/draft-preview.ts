/**
 * Draft sites (Alex, 2026-10-06): a real client's site is built as a draft, so
 * the public gets "not found" at its address until it is switched on. A private
 * link carries a code that opens it; the browser then remembers the code in a
 * cookie for that site only, so every page and the estimate form work.
 *
 * The code is an HMAC of the subdomain under BACKEND_SESSION_SECRET (Web Crypto,
 * so it runs in the edge middleware and in Node scripts alike): nothing to
 * store, and one site's code never opens another.
 */

export const PREVIEW_PARAM = 'preview';
export const PREVIEW_COOKIE = 'bohdi_preview';
/** How long a browser keeps a draft open after following the link. */
export const PREVIEW_MAX_AGE = 60 * 60 * 24 * 30;

const MIN_SECRET_LENGTH = 32;
const CODE_LENGTH = 32;

function base64url(bytes: ArrayBuffer): string {
  let bin = '';
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** The preview code for a subdomain, or null when the secret is missing or too short. */
export async function previewCode(secret: string | undefined, subdomain: string): Promise<string | null> {
  if (secret === undefined || secret.length < MIN_SECRET_LENGTH) return null;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`draft-preview:${subdomain.toLowerCase()}`));
  return base64url(mac).slice(0, CODE_LENGTH);
}

function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** True when `candidate` is this subdomain's preview code. Fails closed without a secret. */
export async function isPreviewCode(secret: string | undefined, subdomain: string, candidate: string | null | undefined): Promise<boolean> {
  if (candidate === null || candidate === undefined || candidate === '') return false;
  const expected = await previewCode(secret, subdomain);
  return expected !== null && sameString(expected, candidate);
}

/** The private link that opens a draft site. */
export function previewLink(subdomain: string, code: string): string {
  return `https://${subdomain}.bohdiai.com/?${PREVIEW_PARAM}=${code}`;
}

/**
 * Whether a request may see a draft site: by the link (`link`: remember the
 * code, then show the page), by the remembered cookie (`cookie`), or not at all.
 */
export async function draftGate(
  secret: string | undefined,
  subdomain: string,
  fromLink: string | null,
  fromCookie: string | undefined,
): Promise<'link' | 'cookie' | 'deny'> {
  if (await isPreviewCode(secret, subdomain, fromLink)) return 'link';
  if (await isPreviewCode(secret, subdomain, fromCookie)) return 'cookie';
  return 'deny';
}

/** Draft pages are never cached or indexed. */
export const DRAFT_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow',
} as const;
