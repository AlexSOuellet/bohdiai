/**
 * The Connect round trip through PayPal, checked on the server. The backend asks
 * PayPal for a sign-up link carrying a tracking ID made of the site and a one-time
 * code, and keeps the code in a cookie on this browser. Coming back, the code must
 * match this browser, the person must still run that site, and PayPal itself (not
 * the address) says which account finished that sign-up and what it allows.
 */
import { appOrigin } from '@/lib/backend/app-url';

export const CONNECT_COOKIE = 'bohdi_paypal_connect';
export const CONNECT_MINUTES = 30;

export function connectReturnUrl(siteUrl: string): string {
  return `${appOrigin(siteUrl)}/api/paypal/return`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The tracking ID PayPal carries through its sign-up: the site, then a one-time code. */
export function trackingId(tenantId: string, nonce: string): string {
  return `${tenantId}.${nonce}`;
}

/** The site a tracking ID names, when its code matches this browser's. */
export function siteFromTracking(tracking: string, cookieNonce: string | undefined): string | null {
  const [tenantId, nonce, ...rest] = tracking.split('.');
  if (rest.length > 0 || tenantId === undefined || nonce === undefined || !UUID.test(tenantId) || !UUID.test(nonce)) return null;
  if (cookieNonce === undefined || cookieNonce !== nonce) return null;
  return tenantId;
}
