/**
 * PayPal settings from the Worker's secrets (Alex sets them; Claude never handles
 * them). PAYPAL_ENV is "sandbox" while testing with PayPal's test accounts and
 * "live" for real money. PAYPAL_PARTNER_MERCHANT_ID is BohdiAI's own PayPal account
 * ID (the partner every maker connects through). Null when any is missing: Connect
 * PayPal says PayPal isn't set up yet instead of half-working.
 *
 * PayPal is switched off (Alex, 2026-11-04: streamlining; it comes back if a maker
 * asks). PAYPAL_ON is the one switch: until it says "on", this is null, so Getting
 * paid shows no PayPal section, the cart shows no PayPal button and its pages turn
 * everyone away. The code stays. To bring PayPal back, set PAYPAL_ON=on with the keys.
 */

export type PayPalConfig = {
  clientId: string;
  clientSecret: string;
  partnerMerchantId: string;
  sandbox: boolean;
  /** PayPal's attribution code for BohdiAI's partner account; PayPal gives it once approved. */
  attributionId: string | null;
};

export function paypalConfig(env: Record<string, string | undefined> = process.env): PayPalConfig | null {
  if (env['PAYPAL_ON'] !== 'on') return null;
  const clientId = env['PAYPAL_CLIENT_ID'];
  const clientSecret = env['PAYPAL_CLIENT_SECRET'];
  const partnerMerchantId = env['PAYPAL_PARTNER_MERCHANT_ID'];
  const mode = env['PAYPAL_ENV'];
  if (!clientId || !clientSecret || !partnerMerchantId || (mode !== 'sandbox' && mode !== 'live')) return null;
  return { clientId, clientSecret, partnerMerchantId, sandbox: mode === 'sandbox', attributionId: env['PAYPAL_ATTRIBUTION_ID'] || null };
}

/** PayPal's address: its test copy while testing. */
export function paypalBase(config: Pick<PayPalConfig, 'sandbox'>): string {
  return config.sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
}

/** What a maker's connection lets BohdiAI do on her account: take payments and give refunds. Nothing else. */
export const PAYPAL_FEATURES = ['PAYMENT', 'REFUND'] as const;
