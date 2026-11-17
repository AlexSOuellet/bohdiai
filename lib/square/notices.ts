/**
 * Square's notices: proof a notice really came from Square (its signature is an
 * HMAC-SHA256, with the key Square gave us, of the exact address it was sent to and
 * the body), and the one part BohdiAI reads: a card payment that completed, on which
 * order, for which Square business.
 */
import type { SquareNotices } from './config';

function bytes(s: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(s);
}

function base64(buf: ArrayBuffer): string {
  let out = '';
  for (const b of new Uint8Array(buf)) out += String.fromCharCode(b);
  return btoa(out);
}

/** True when the signature is Square's own for this body. Compared in full,
 *  whatever the first difference, so the time taken gives nothing away. */
export async function fromSquare(notices: SquareNotices, body: string, signature: string | null): Promise<boolean> {
  if (signature === null || signature === '') return false;
  const key = await crypto.subtle.importKey('raw', bytes(notices.signatureKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = base64(await crypto.subtle.sign('HMAC', key, bytes(notices.url + body)));
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

/** A completed payment's order and business, or null for anything else. */
export function completedPayment(body: string): { squareOrderId: string; merchantId: string } | null {
  let event: unknown;
  try {
    event = JSON.parse(body);
  } catch {
    return null;
  }
  if (event === null || typeof event !== 'object') return null;
  const e = event as { type?: unknown; merchant_id?: unknown; data?: { object?: { payment?: { status?: unknown; order_id?: unknown } } } };
  if (e.type !== 'payment.created' && e.type !== 'payment.updated') return null;
  const payment = e.data?.object?.payment;
  if (payment?.status !== 'COMPLETED' || typeof payment.order_id !== 'string' || payment.order_id === '' || typeof e.merchant_id !== 'string') return null;
  return { squareOrderId: payment.order_id, merchantId: e.merchant_id };
}
