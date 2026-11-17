/**
 * The few calls BohdiAI makes to Square: the Connect step (authorize, swap the code
 * for keys, renew, cancel) and what the market app reads (the business, its
 * locations, an order and its payment). Every call names the API version; `fetcher`
 * is swappable for tests.
 */
import { SQUARE_SCOPES, SQUARE_VERSION, squareBase, type SquareConfig } from './config';

export type SquareKeys = { accessToken: string; refreshToken: string; expiresAt: string; merchantId: string };
export type SquareLocation = { id: string; name: string };

type Fetcher = typeof fetch;

export class SquareError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Square's own page, where the maker signs in and says yes. */
export function authorizeUrl(config: SquareConfig, state: string): string {
  const q = new URLSearchParams({ client_id: config.applicationId, scope: SQUARE_SCOPES.join(' '), state });
  // Always ask the maker to sign in, so a stray Square session on a shared computer
  // isn't connected by mistake (Square's test copy doesn't support it).
  if (!config.sandbox) q.set('session', 'false');
  return `${squareBase(config)}/oauth2/authorize?${q.toString()}`;
}

async function call<T>(fetcher: Fetcher, url: string, init: RequestInit): Promise<T> {
  const res = await fetcher(url, { ...init, headers: { 'Content-Type': 'application/json', 'Square-Version': SQUARE_VERSION, ...init.headers } });
  const text = await res.text();
  if (!res.ok) {
    // Square's error codes only, never the body (it can echo what was sent).
    let code = '';
    try {
      const body = JSON.parse(text) as { errors?: { code?: string }[]; type?: string };
      code = body.errors?.map((e) => e.code).join(',') ?? body.type ?? '';
    } catch {
      code = '';
    }
    throw new SquareError(`Square ${res.status} ${code}`.trim(), res.status);
  }
  return JSON.parse(text) as T;
}

type TokenBody = { access_token?: string; refresh_token?: string; expires_at?: string; merchant_id?: string };

function keysFrom(body: TokenBody, refreshToken?: string): SquareKeys {
  const refresh = body.refresh_token ?? refreshToken;
  if (!body.access_token || !refresh || !body.expires_at || !body.merchant_id) throw new SquareError('Square sent back an incomplete key', 502);
  return { accessToken: body.access_token, refreshToken: refresh, expiresAt: body.expires_at, merchantId: body.merchant_id };
}

/** The code from Square's page, swapped for the keys (usable once, for 5 minutes). */
export async function swapCode(config: SquareConfig, code: string, fetcher: Fetcher = fetch): Promise<SquareKeys> {
  const body = await call<TokenBody>(fetcher, `${squareBase(config)}/oauth2/token`, {
    method: 'POST',
    body: JSON.stringify({ client_id: config.applicationId, client_secret: config.applicationSecret, code, grant_type: 'authorization_code' }),
  });
  return keysFrom(body);
}

/** A fresh access key (they last 30 days); the renewal key stays the same unless Square sends a new one. */
export async function renewKeys(config: SquareConfig, refreshToken: string, fetcher: Fetcher = fetch): Promise<SquareKeys> {
  const body = await call<TokenBody>(fetcher, `${squareBase(config)}/oauth2/token`, {
    method: 'POST',
    body: JSON.stringify({ client_id: config.applicationId, client_secret: config.applicationSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }),
  });
  return keysFrom(body, refreshToken);
}

/** Cancels every key BohdiAI holds for this business, on Square's side. */
export async function cancelKeys(config: SquareConfig, merchantId: string, fetcher: Fetcher = fetch): Promise<void> {
  await call<unknown>(fetcher, `${squareBase(config)}/oauth2/revoke`, {
    method: 'POST',
    headers: { Authorization: `Client ${config.applicationSecret}` },
    body: JSON.stringify({ client_id: config.applicationId, merchant_id: merchantId }),
  });
}

function authed(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export async function businessName(config: SquareConfig, token: string, merchantId: string, fetcher: Fetcher = fetch): Promise<string> {
  const body = await call<{ merchant?: { business_name?: string } }>(fetcher, `${squareBase(config)}/v2/merchants/${encodeURIComponent(merchantId)}`, { method: 'GET', headers: authed(token) });
  return body.merchant?.business_name ?? '';
}

/** The business's open locations, in Square's order. */
export async function openLocations(config: SquareConfig, token: string, fetcher: Fetcher = fetch): Promise<SquareLocation[]> {
  const body = await call<{ locations?: { id?: string; name?: string; status?: string }[] }>(fetcher, `${squareBase(config)}/v2/locations`, { method: 'GET', headers: authed(token) });
  return (body.locations ?? []).flatMap((l) => (l.id && l.status === 'ACTIVE' ? [{ id: l.id, name: l.name ?? '' }] : []));
}

/** What Square says about a card sale: the order the Square app made, its location,
 *  and its card payments. */
export type SquareSale = {
  orderId: string;
  locationId: string;
  state: string;
  totalCents: number;
  currency: string;
  payments: { id: string; amountCents: number; type: string }[];
  /** Our own order's ID, on an order BohdiAI made for Square's checkout page ('' otherwise). */
  referenceId: string;
  /** What's still owed on it (0 once it's paid in full). */
  dueCents: number;
};

type Money = { amount?: number; currency?: string };

/** The order behind a sale the Square app took (its transaction ID is the order's
 *  ID), or behind a Square checkout page. */
export async function findSale(config: SquareConfig, token: string, orderId: string, fetcher: Fetcher = fetch): Promise<SquareSale | null> {
  type Order = {
    id?: string;
    location_id?: string;
    state?: string;
    reference_id?: string;
    total_money?: Money;
    net_amount_due_money?: Money;
    tenders?: { payment_id?: string; id?: string; type?: string; amount_money?: Money }[];
  };
  let body: { order?: Order };
  try {
    body = await call<{ order?: Order }>(fetcher, `${squareBase(config)}/v2/orders/${encodeURIComponent(orderId)}`, { method: 'GET', headers: authed(token) });
  } catch (err) {
    if (err instanceof SquareError && err.status === 404) return null;
    throw err;
  }
  const o = body.order;
  if (!o?.id || !o.location_id) return null;
  return {
    orderId: o.id,
    locationId: o.location_id,
    state: o.state ?? '',
    totalCents: o.total_money?.amount ?? 0,
    currency: o.total_money?.currency ?? '',
    payments: (o.tenders ?? []).map((t) => ({ id: t.payment_id ?? t.id ?? '', amountCents: t.amount_money?.amount ?? 0, type: t.type ?? '' })),
    referenceId: o.reference_id ?? '',
    dueCents: o.net_amount_due_money?.amount ?? o.total_money?.amount ?? 0,
  };
}

/** What the shopper pays for on Square's checkout page: our order, line by line,
 *  at the prices our server worked out, with any money off. */
export type CheckoutOrder = {
  /** Our own order's ID: Square keeps it on its order, and every step checks it. */
  referenceId: string;
  locationId: string;
  currency: string;
  lines: readonly { name: string; cents: number }[];
  discount: { name: string; cents: number } | null;
  /** Where Square sends the shopper once they've paid. */
  redirectUrl: string;
  buyerEmail: string;
  /** Shown in the maker's Square beside the payment. */
  note: string;
};

export type PaymentLink = { url: string; orderId: string; totalCents: number; currency: string };

/** A Square checkout page for exactly this order, in the maker's own Square. No
 *  tips and no taxes added by Square: the shopper can change only how they pay. */
export async function createPaymentLink(config: SquareConfig, token: string, order: CheckoutOrder, fetcher: Fetcher = fetch): Promise<PaymentLink> {
  const money = (cents: number): Money => ({ amount: cents, currency: order.currency });
  type Made = { payment_link?: { url?: string; order_id?: string }; related_resources?: { orders?: { id?: string; total_money?: Money }[] } };
  const body = await call<Made>(fetcher, `${squareBase(config)}/v2/online-checkout/payment-links`, {
    method: 'POST',
    headers: authed(token),
    body: JSON.stringify({
      idempotency_key: `checkout-${order.referenceId}`,
      order: {
        location_id: order.locationId,
        reference_id: order.referenceId,
        line_items: order.lines.map((l) => ({ name: l.name.slice(0, 500), quantity: '1', base_price_money: money(l.cents) })),
        ...(order.discount === null ? {} : { discounts: [{ uid: 'off', name: order.discount.name.slice(0, 255), amount_money: money(order.discount.cents), scope: 'ORDER' }] }),
      },
      checkout_options: { redirect_url: order.redirectUrl, allow_tipping: false, ask_for_shipping_address: false },
      ...(order.buyerEmail === '' ? {} : { pre_populated_data: { buyer_email: order.buyerEmail } }),
      payment_note: order.note.slice(0, 500),
    }),
  });
  const link = body.payment_link;
  if (!link?.url || !link.order_id) throw new SquareError('Square sent back an incomplete checkout page', 502);
  const made = (body.related_resources?.orders ?? []).find((o) => o.id === link.order_id);
  return { url: link.url, orderId: link.order_id, totalCents: made?.total_money?.amount ?? -1, currency: made?.total_money?.currency ?? '' };
}

/** One payment, as Square has it. */
export type SquarePayment = { id: string; status: string; amountCents: number; currency: string; orderId: string; locationId: string };

export async function findPayment(config: SquareConfig, token: string, paymentId: string, fetcher: Fetcher = fetch): Promise<SquarePayment | null> {
  type Payment = { id?: string; status?: string; amount_money?: Money; order_id?: string; location_id?: string };
  let body: { payment?: Payment };
  try {
    body = await call<{ payment?: Payment }>(fetcher, `${squareBase(config)}/v2/payments/${encodeURIComponent(paymentId)}`, { method: 'GET', headers: authed(token) });
  } catch (err) {
    if (err instanceof SquareError && err.status === 404) return null;
    throw err;
  }
  const p = body.payment;
  if (!p?.id) return null;
  return { id: p.id, status: p.status ?? '', amountCents: p.amount_money?.amount ?? 0, currency: p.amount_money?.currency ?? '', orderId: p.order_id ?? '', locationId: p.location_id ?? '' };
}

/** Give a payment's money back, in full. The key makes a second try the same
 *  refund, never a second one (Square allows 45 characters). Returns Square's refund ID. */
export async function refundPayment(
  config: SquareConfig,
  token: string,
  args: { paymentId: string; cents: number; currency: string; key: string; reason: string },
  fetcher: Fetcher = fetch,
): Promise<string> {
  const body = await call<{ refund?: { id?: string; status?: string } }>(fetcher, `${squareBase(config)}/v2/refunds`, {
    method: 'POST',
    headers: authed(token),
    body: JSON.stringify({ idempotency_key: args.key.slice(0, 45), payment_id: args.paymentId, amount_money: { amount: args.cents, currency: args.currency }, reason: args.reason.slice(0, 192) }),
  });
  const refund = body.refund;
  if (!refund?.id || refund.status === 'REJECTED' || refund.status === 'FAILED') throw new SquareError(`Square refused the refund ${refund?.status ?? ''}`.trim(), 402);
  return refund.id;
}
