/**
 * The shopper's cart, kept in one first-party cookie on the shop's own host: what
 * they added, in the order they added it. Each entry is a piece's listing id, or
 * for a piece with options, the listing id and the chosen combination's id
 * (`<listing>~<combination>`). Nothing else lives in it (no prices, no names), so
 * the server always reads both fresh from the catalog and a tampered cookie can
 * only name listings, never set a price.
 *
 * Pure helpers shared by the browser (add / remove) and the server (cart page,
 * order request). One of each entry: the shops using it sell one-of-a-kind work.
 */

export const CART_COOKIE = 'bohdi_cart';
/** How many different pieces one cart holds. */
export const CART_MAX = 20;
/** Thirty days, in seconds. */
export const CART_MAX_AGE = 60 * 60 * 24 * 30;
/** Fired on `window` whenever the cart cookie changes, so the nav count follows. */
export const CART_EVENT = 'bohdi:cart';

const ID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const UUID = new RegExp(`^${ID}(~${ID})?$`, 'i');

/** The cart entry for a piece, or one of its combinations. */
export function cartEntry(listingId: string, variantId: string | null = null): string {
  return (variantId === null ? listingId : `${listingId}~${variantId}`).toLowerCase();
}

/** A cart entry's piece and combination. */
export function splitEntry(entry: string): { listingId: string; variantId: string | null } {
  const [listingId = '', variantId] = entry.split('~');
  return { listingId, variantId: variantId ?? null };
}

/** True for a well-formed cart entry. */
export function isCartEntry(entry: string): boolean {
  return UUID.test(entry);
}

/** The entries in a cookie value: well-formed only, no repeats, at most CART_MAX. */
export function parseCart(raw: string | undefined | null): string[] {
  if (raw === undefined || raw === null || raw === '') return [];
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const part of decoded.split('.')) {
    const id = part.trim().toLowerCase();
    if (UUID.test(id) && !out.includes(id)) out.push(id);
    if (out.length === CART_MAX) break;
  }
  return out;
}

export function serializeCart(ids: readonly string[]): string {
  return parseCart(ids.join('.')).join('.');
}

export function addToCart(ids: readonly string[], id: string): string[] {
  const clean = parseCart(ids.join('.'));
  const key = id.toLowerCase();
  if (!UUID.test(key) || clean.includes(key) || clean.length >= CART_MAX) return clean;
  return [...clean, key];
}

export function removeFromCart(ids: readonly string[], id: string): string[] {
  const key = id.toLowerCase();
  return parseCart(ids.join('.')).filter((x) => x !== key);
}

/** The cookie value out of a `document.cookie` / Cookie header string. */
export function cartFromCookieHeader(header: string | null | undefined): string[] {
  if (header === null || header === undefined) return [];
  for (const pair of header.split(';')) {
    const eq = pair.indexOf('=');
    if (eq === -1) continue;
    if (pair.slice(0, eq).trim() === CART_COOKIE) return parseCart(pair.slice(eq + 1).trim());
  }
  return [];
}

/** The `document.cookie` assignment that stores `ids` (or clears the cart when empty). */
export function cartCookieString(ids: readonly string[], secure: boolean): string {
  const value = serializeCart(ids);
  const age = value === '' ? 0 : CART_MAX_AGE;
  return `${CART_COOKIE}=${value}; Path=/; Max-Age=${age}; SameSite=Lax${secure ? '; Secure' : ''}`;
}
