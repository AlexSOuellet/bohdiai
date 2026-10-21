/**
 * Square settings from the Worker's secrets (Alex sets them; Claude never handles
 * them). SQUARE_ENV is "sandbox" while testing with Square's test accounts and
 * "production" for real money. Null when any is missing: the Connect Square button
 * says Square isn't set up yet instead of half-working.
 */

export type SquareConfig = {
  applicationId: string;
  applicationSecret: string;
  /** base64 of 32 random bytes: scrambles the keys before they're stored. */
  tokenKey: string;
  sandbox: boolean;
};

export function squareConfig(env: Record<string, string | undefined> = process.env): SquareConfig | null {
  const applicationId = env['SQUARE_APPLICATION_ID'];
  const applicationSecret = env['SQUARE_APPLICATION_SECRET'];
  const tokenKey = env['SQUARE_TOKEN_KEY'];
  const mode = env['SQUARE_ENV'];
  if (!applicationId || !applicationSecret || !tokenKey || (mode !== 'sandbox' && mode !== 'production')) return null;
  return { applicationId, applicationSecret, tokenKey, sandbox: mode === 'sandbox' };
}

/** Square's address: its test copy while testing. */
export function squareBase(config: Pick<SquareConfig, 'sandbox'>): string {
  return config.sandbox ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com';
}

/** The fewest permissions the market app needs: who the business is, its
 *  locations, and reading an order and its payment to confirm a card sale. */
export const SQUARE_SCOPES = ['MERCHANT_PROFILE_READ', 'ORDERS_READ', 'PAYMENTS_READ'] as const;

/** The Square API version every call names, so a change on Square's side can't
 *  quietly change what comes back. */
export const SQUARE_VERSION = '2025-01-23';
