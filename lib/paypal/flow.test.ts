import { describe, it, expect } from 'vitest';
import { connectReturnUrl, siteFromTracking, trackingId } from './flow';
import { captureMatches } from './checkout';
import { canTakeOrders } from './connection';

const SITE = '3a880ace-f21c-498e-9a92-477ba31d41f8';
const CODE = '0b9c2f1e-6d4a-4c1b-9e2f-7a8b9c0d1e2f';

describe('the Connect round trip', () => {
  it('comes back to the backend', () => {
    expect(connectReturnUrl('https://bohdiai.com')).toMatch(/\/api\/paypal\/return$/);
  });
  it('names the site when the code matches this browser', () => {
    expect(siteFromTracking(trackingId(SITE, CODE), CODE)).toBe(SITE);
  });
  it('refuses another browser, a missing code, or a made-up tracking ID', () => {
    expect(siteFromTracking(trackingId(SITE, CODE), undefined)).toBeNull();
    expect(siteFromTracking(trackingId(SITE, CODE), '11111111-1111-4111-8111-111111111111')).toBeNull();
    expect(siteFromTracking(`${SITE}.${CODE}.extra`, CODE)).toBeNull();
    expect(siteFromTracking(`not-a-site.${CODE}`, CODE)).toBeNull();
    expect(siteFromTracking(SITE, CODE)).toBeNull();
    expect(siteFromTracking(`${SITE}.not-a-code`, 'not-a-code')).toBeNull();
  });
});

describe('canTakeOrders', () => {
  it('needs payments receivable and a confirmed email', () => {
    expect(canTakeOrders({ paymentsReceivable: true, emailConfirmed: true })).toBe(true);
    expect(canTakeOrders({ paymentsReceivable: true, emailConfirmed: false })).toBe(false);
    expect(canTakeOrders({ paymentsReceivable: false, emailConfirmed: true })).toBe(false);
  });
});

describe('captureMatches', () => {
  const good = { orderId: 'PP1', status: 'COMPLETED', captureId: 'CAP1', captureStatus: 'COMPLETED', cents: 600, currency: 'usd', customId: 'o1', payee: 'M1' };
  const expected = { paypalOrderId: 'PP1', orderId: 'o1', merchantId: 'M1', cents: 600, currency: 'USD' };
  it('records a payment PayPal completed for exactly our order, into her account', () => {
    expect(captureMatches(good, expected)).toBe(true);
  });
  it.each([
    ['another PayPal order', { orderId: 'PP2' }],
    ['an order not completed', { status: 'APPROVED' }],
    ['a capture not completed', { captureStatus: 'PENDING' }],
    ['no capture', { captureId: '' }],
    ['someone else’s order', { customId: 'o2' }],
    ['another account', { payee: 'M2' }],
    ['a different amount', { cents: 599 }],
    ['no amount', { cents: null }],
    ['another currency', { currency: 'CAD' }],
  ])('refuses %s', (_name, change) => {
    expect(captureMatches({ ...good, ...change }, expected)).toBe(false);
  });
});
