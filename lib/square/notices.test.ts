import { describe, it, expect } from 'vitest';
import { completedPayment, fromSquare } from './notices';
import { squareNotices } from './config';

const notices = { signatureKey: 'sig-key', url: 'https://bohdiai.com/api/square/webhook' };

async function sign(key: string, message: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(message)));
  return btoa(String.fromCharCode(...sig));
}

describe('squareNotices', () => {
  it('needs the key and the address', () => {
    expect(squareNotices({ SQUARE_WEBHOOK_SIGNATURE_KEY: 'k', SQUARE_WEBHOOK_URL: 'u' })).toEqual({ signatureKey: 'k', url: 'u' });
    expect(squareNotices({ SQUARE_WEBHOOK_SIGNATURE_KEY: 'k' })).toBeNull();
    expect(squareNotices({ SQUARE_WEBHOOK_URL: 'u' })).toBeNull();
  });
});

describe('fromSquare', () => {
  const body = '{"type":"payment.updated"}';
  it('accepts Square’s own signature of the address and the body', async () => {
    expect(await fromSquare(notices, body, await sign('sig-key', notices.url + body))).toBe(true);
  });
  it('refuses any other signature, address, body or none', async () => {
    expect(await fromSquare(notices, body, await sign('other-key', notices.url + body))).toBe(false);
    expect(await fromSquare(notices, body, await sign('sig-key', 'https://elsewhere' + body))).toBe(false);
    expect(await fromSquare(notices, body + ' ', await sign('sig-key', notices.url + body))).toBe(false);
    expect(await fromSquare(notices, body, 'short')).toBe(false);
    expect(await fromSquare(notices, body, '')).toBe(false);
    expect(await fromSquare(notices, body, null)).toBe(false);
  });
});

describe('completedPayment', () => {
  const event = (type: string, payment: Record<string, unknown>, merchant: unknown = 'M1') => JSON.stringify({ type, merchant_id: merchant, data: { object: { payment } } });
  it('reads a completed payment’s order and business', () => {
    expect(completedPayment(event('payment.updated', { status: 'COMPLETED', order_id: 'SQO' }))).toEqual({ squareOrderId: 'SQO', merchantId: 'M1' });
    expect(completedPayment(event('payment.created', { status: 'COMPLETED', order_id: 'SQO' }))).toEqual({ squareOrderId: 'SQO', merchantId: 'M1' });
  });
  it('ignores everything else', () => {
    expect(completedPayment(event('payment.updated', { status: 'APPROVED', order_id: 'SQO' }))).toBeNull();
    expect(completedPayment(event('refund.updated', { status: 'COMPLETED', order_id: 'SQO' }))).toBeNull();
    expect(completedPayment(event('payment.updated', { status: 'COMPLETED', order_id: '' }))).toBeNull();
    expect(completedPayment(event('payment.updated', { status: 'COMPLETED' }))).toBeNull();
    expect(completedPayment(event('payment.updated', { status: 'COMPLETED', order_id: 'SQO' }, 7))).toBeNull();
    expect(completedPayment('{"type":"payment.updated"}')).toBeNull();
    expect(completedPayment('null')).toBeNull();
    expect(completedPayment('not json')).toBeNull();
  });
});
