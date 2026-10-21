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
};

/** The order behind a sale the Square app took (its transaction ID is the order's ID). */
export async function findSale(config: SquareConfig, token: string, orderId: string, fetcher: Fetcher = fetch): Promise<SquareSale | null> {
  type Money = { amount?: number; currency?: string };
  type Order = { id?: string; location_id?: string; state?: string; total_money?: Money; tenders?: { payment_id?: string; id?: string; type?: string; amount_money?: Money }[] };
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
  };
}
