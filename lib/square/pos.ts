/**
 * Handing a card sale to the Square app on the maker's phone (Square's Point of
 * Sale API, web): the market app opens Square with the total filled in, the maker
 * taps, inserts or types the card in Square's own screen, and Square comes back to
 * BohdiAI's return address with the result. The card never touches BohdiAI.
 *
 * The sale's details ride along as a signed note (Square hands it back unchanged as
 * `state` on iPhone, REQUEST_METADATA on Android), so nothing waits in the database
 * while the maker is in Square.
 */

/** A line of a card sale; `agreedCents` is a price agreed with the buyer for the
 *  whole line, below its marked price. */
export type CardSaleLine = { listingId: string; variantId: string | null; quantity: number; agreedCents?: number | null };

/** A card sale on its way to Square; `nonce` makes each hand-off recordable once. */
export type CardSaleNote = { tenantId: string; eventId: string; nonce: string; lines: CardSaleLine[]; totalCents: number; expires: number };

export const CARD_SALE_PURPOSE = 'square-card-sale';
/** How long the maker has to finish in Square before the hand-off is refused. */
export const CARD_SALE_MINUTES = 30;
/** How long Square shows the finished sale before going back, on Android. */
export const AUTO_RETURN_MS = 4000;

/** Card in the market app: ready, waiting on a step on Getting paid, or off (Square
 *  not connected, or cards not set up on BohdiAI). */
export type CardState = 'ready' | 'pick-location' | 'off';

/** The Square app runs on phones and tablets. An iPad's browser calls itself a Mac,
 *  so a Mac that takes touches is an iPad. */
export function canOpenSquare(userAgent: string, touchPoints: number): boolean {
  return /android|iphone|ipad|ipod/i.test(userAgent) || (/macintosh/i.test(userAgent) && touchPoints > 1);
}

/** Square's own app, opened from the market app. The phone picks: iPhones use
 *  Square's link, Android its app address. */
export type SquareHandOff = { iphone: string; android: string };

export function squareHandOff(args: {
  applicationId: string;
  callbackUrl: string;
  totalCents: number;
  note: string;
  locationId: string | null;
  state: string;
  fallbackUrl: string;
}): SquareHandOff {
  const data = {
    amount_money: { amount: String(args.totalCents), currency_code: 'USD' },
    callback_url: args.callbackUrl,
    client_id: args.applicationId,
    version: '1.3',
    notes: args.note,
    state: args.state,
    ...(args.locationId === null ? {} : { location_id: args.locationId }),
    // Cards only, read by the reader or typed in by hand in Square's screen.
    options: { supported_tender_types: ['CARD_FROM_READER', 'KEYED_IN_CARD'], auto_return: true },
  };
  const extra = (key: string, value: string): string => `${key}=${encodeURIComponent(value)}`;
  const android = [
    'intent:#Intent',
    'action=com.squareup.pos.action.CHARGE',
    'package=com.squareup',
    extra('S.browser_fallback_url', args.fallbackUrl),
    extra('S.com.squareup.pos.WEB_CALLBACK_URI', args.callbackUrl),
    extra('S.com.squareup.pos.CLIENT_ID', args.applicationId),
    'S.com.squareup.pos.API_VERSION=v2.0',
    `i.com.squareup.pos.TOTAL_AMOUNT=${args.totalCents}`,
    'S.com.squareup.pos.CURRENCY_CODE=USD',
    'S.com.squareup.pos.TENDER_TYPES=com.squareup.pos.TENDER_CARD',
    // Back to the market app on its own once the sale is done (Android waits on its
    // Done screen otherwise, and the sale is never recorded). Square allows 3.2 to 10 s.
    `l.com.squareup.pos.AUTO_RETURN_TIMEOUT_MS=${AUTO_RETURN_MS}`,
    extra('S.com.squareup.pos.NOTE', args.note),
    extra('S.com.squareup.pos.REQUEST_METADATA', args.state),
    ...(args.locationId === null ? [] : [extra('S.com.squareup.pos.LOCATION_ID', args.locationId)]),
    'end',
  ].join(';');
  return { iphone: `square-commerce-v1://payment/create?data=${encodeURIComponent(JSON.stringify(data))}`, android };
}

/** What Square came back with, from either phone. */
export type SquareReturn =
  | { kind: 'paid'; orderId: string; state: string }
  /** Taken with no signal: Square sends it when the phone is back online, so there's
   *  nothing to confirm yet. */
  | { kind: 'offline'; state: string }
  | { kind: 'failed'; code: string; state: string };

export function readSquareReturn(params: URLSearchParams): SquareReturn | null {
  const iphone = params.get('data');
  if (iphone !== null) {
    let d: { transaction_id?: unknown; client_transaction_id?: unknown; status?: unknown; error_code?: unknown; state?: unknown };
    try {
      d = JSON.parse(iphone) as typeof d;
    } catch {
      return null;
    }
    const state = typeof d.state === 'string' ? d.state : '';
    if (d.status === 'ok') {
      if (typeof d.transaction_id === 'string' && d.transaction_id !== '') return { kind: 'paid', orderId: d.transaction_id, state };
      if (typeof d.client_transaction_id === 'string' && d.client_transaction_id !== '') return { kind: 'offline', state };
      return null;
    }
    return { kind: 'failed', code: typeof d.error_code === 'string' ? d.error_code : 'unknown', state };
  }
  const state = params.get('com.squareup.pos.REQUEST_METADATA') ?? '';
  const error = params.get('com.squareup.pos.ERROR_CODE');
  if (error !== null) return { kind: 'failed', code: error, state };
  const server = params.get('com.squareup.pos.SERVER_TRANSACTION_ID');
  if (server !== null && server !== '') return { kind: 'paid', orderId: server, state };
  const client = params.get('com.squareup.pos.CLIENT_TRANSACTION_ID');
  if (client !== null && client !== '') return { kind: 'offline', state };
  return null;
}

/** The maker stepped back out of Square without charging: not a problem to report. */
export function wasCanceled(code: string): boolean {
  return code === 'payment_canceled' || code === 'com.squareup.pos.ERROR_TRANSACTION_CANCELED';
}

/** Square's card sale matches what the market app sent: completed, the same total,
 *  in dollars, at the maker's location, and paid by card. */
export function saleMatches(
  sale: { state: string; totalCents: number; currency: string; locationId: string; payments: { type: string; amountCents: number }[] },
  expect: { totalCents: number; locationId: string | null },
): boolean {
  if (sale.state !== 'COMPLETED' || sale.currency !== 'USD' || sale.totalCents !== expect.totalCents) return false;
  if (expect.locationId !== null && sale.locationId !== expect.locationId) return false;
  const card = sale.payments.filter((p) => p.type === 'CARD').reduce((n, p) => n + p.amountCents, 0);
  return card === expect.totalCents;
}
