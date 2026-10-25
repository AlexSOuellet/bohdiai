/**
 * The few calls BohdiAI makes to PayPal, all with BohdiAI's own partner keys: the
 * Connect step (a sign-up link, then who connected and what PayPal says about her
 * account) and an online order (create it for her account, capture it once the buyer
 * approves, refund it). `fetcher` is swappable for tests.
 */
import { PAYPAL_FEATURES, paypalBase, type PayPalConfig } from './config';

type Fetcher = typeof fetch;

export class PayPalError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function call<T>(fetcher: Fetcher, url: string, init: RequestInit): Promise<T> {
  const res = await fetcher(url, init);
  const text = await res.text();
  if (!res.ok) {
    // PayPal's error name only, never the body (it can echo what was sent).
    let name = '';
    try {
      const body = JSON.parse(text) as { name?: string; error?: string; details?: { issue?: string }[] };
      name = [body.name ?? body.error ?? '', ...(body.details ?? []).map((d) => d.issue ?? '')].filter((s) => s !== '').join(',');
    } catch {
      name = '';
    }
    throw new PayPalError(`PayPal ${res.status} ${name}`.trim(), res.status);
  }
  return (text === '' ? {} : JSON.parse(text)) as T;
}

/** A short-lived key for BohdiAI's own partner account (asked for per use; never stored). */
export async function partnerToken(config: PayPalConfig, fetcher: Fetcher = fetch): Promise<string> {
  const body = await call<{ access_token?: string }>(fetcher, `${paypalBase(config)}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!body.access_token) throw new PayPalError('PayPal sent back no key', 502);
  return body.access_token;
}

function headers(config: PayPalConfig, token: string, extra: Record<string, string> = {}): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(config.attributionId === null ? {} : { 'PayPal-Partner-Attribution-Id': config.attributionId }),
    ...extra,
  };
}

/** PayPal's own page where the maker signs in (or signs up) and agrees to connect. */
export async function signUpLink(config: PayPalConfig, token: string, trackingId: string, returnUrl: string, fetcher: Fetcher = fetch): Promise<string> {
  const body = await call<{ links?: { rel?: string; href?: string }[] }>(fetcher, `${paypalBase(config)}/v2/customer/partner-referrals`, {
    method: 'POST',
    headers: headers(config, token),
    body: JSON.stringify({
      tracking_id: trackingId,
      operations: [
        {
          operation: 'API_INTEGRATION',
          api_integration_preference: {
            rest_api_integration: { integration_method: 'PAYPAL', integration_type: 'THIRD_PARTY', third_party_details: { features: PAYPAL_FEATURES } },
          },
        },
      ],
      products: ['PPCP'],
      legal_consents: [{ type: 'SHARE_DATA_CONSENT', granted: true }],
      partner_config_override: { return_url: returnUrl },
    }),
  });
  const href = body.links?.find((l) => l.rel === 'action_url')?.href;
  if (!href) throw new PayPalError('PayPal sent back no sign-up link', 502);
  return href;
}

/** The PayPal account that finished the sign-up started with this tracking ID, or null when none has. */
export async function merchantFor(config: PayPalConfig, token: string, trackingId: string, fetcher: Fetcher = fetch): Promise<string | null> {
  try {
    const body = await call<{ merchant_id?: string }>(
      fetcher,
      `${paypalBase(config)}/v1/customer/partners/${encodeURIComponent(config.partnerMerchantId)}/merchant-integrations?tracking_id=${encodeURIComponent(trackingId)}`,
      { method: 'GET', headers: headers(config, token) },
    );
    return body.merchant_id ?? null;
  } catch (err) {
    if (err instanceof PayPalError && err.status === 404) return null;
    throw err;
  }
}

/** What PayPal says about a connected account. */
export type MerchantStatus = {
  merchantId: string;
  email: string;
  paymentsReceivable: boolean;
  emailConfirmed: boolean;
  /** She granted BohdiAI taking payments and giving refunds on her account. */
  permissionsGranted: boolean;
  /** PayPal approved her to take cards typed on the site (its card form). */
  cardsApproved: boolean;
};

export async function merchantStatus(config: PayPalConfig, token: string, merchantId: string, fetcher: Fetcher = fetch): Promise<MerchantStatus> {
  type Body = {
    merchant_id?: string;
    primary_email?: string;
    payments_receivable?: boolean;
    primary_email_confirmed?: boolean;
    oauth_integrations?: { oauth_third_party?: { partner_client_id?: string; scopes?: string[] }[] }[];
    capabilities?: { name?: string; status?: string }[];
  };
  const body = await call<Body>(
    fetcher,
    `${paypalBase(config)}/v1/customer/partners/${encodeURIComponent(config.partnerMerchantId)}/merchant-integrations/${encodeURIComponent(merchantId)}`,
    { method: 'GET', headers: headers(config, token) },
  );
  const thirdParty = (body.oauth_integrations ?? []).flatMap((o) => o.oauth_third_party ?? []);
  return {
    merchantId: body.merchant_id ?? merchantId,
    email: body.primary_email ?? '',
    paymentsReceivable: body.payments_receivable === true,
    emailConfirmed: body.primary_email_confirmed === true,
    permissionsGranted: thirdParty.some((t) => t.partner_client_id === config.clientId),
    cardsApproved: (body.capabilities ?? []).some((c) => c.name === 'CUSTOM_CARD_PROCESSING' && c.status === 'ACTIVE'),
  };
}

/** Money as PayPal writes it: "6.00". */
export function paypalAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Cents from PayPal's "6.00"; null when it isn't a plain amount. */
export function centsOf(value: string | undefined): number | null {
  if (value === undefined || !/^\d+(\.\d{1,2})?$/.test(value)) return null;
  return Math.round(Number(value) * 100);
}

/** A PayPal order for one of our pending orders, paid into the maker's own account. Returns PayPal's order ID. */
export async function createPayPalOrder(
  config: PayPalConfig,
  token: string,
  order: { id: string; invoiceId: string; totalCents: number; currency: string; merchantId: string; description: string },
  fetcher: Fetcher = fetch,
): Promise<string> {
  const body = await call<{ id?: string }>(fetcher, `${paypalBase(config)}/v2/checkout/orders`, {
    method: 'POST',
    // The same order is never created twice at PayPal, even if the request is retried.
    headers: headers(config, token, { 'PayPal-Request-Id': `create-${order.id}` }),
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: order.id,
          custom_id: order.id,
          invoice_id: order.invoiceId,
          description: order.description.slice(0, 127),
          amount: { currency_code: order.currency, value: paypalAmount(order.totalCents) },
          payee: { merchant_id: order.merchantId },
        },
      ],
    }),
  });
  if (!body.id) throw new PayPalError('PayPal sent back no order', 502);
  return body.id;
}

/** What PayPal says happened when the buyer's approved order was captured. */
export type Capture = { orderId: string; status: string; captureId: string; captureStatus: string; cents: number | null; currency: string; customId: string; payee: string };

export async function capturePayPalOrder(config: PayPalConfig, token: string, paypalOrderId: string, fetcher: Fetcher = fetch): Promise<Capture> {
  type Body = {
    id?: string;
    status?: string;
    purchase_units?: {
      custom_id?: string;
      payee?: { merchant_id?: string };
      payments?: { captures?: { id?: string; status?: string; custom_id?: string; amount?: { value?: string; currency_code?: string } }[] };
    }[];
  };
  const body = await call<Body>(fetcher, `${paypalBase(config)}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: 'POST',
    headers: headers(config, token, { 'PayPal-Request-Id': `capture-${paypalOrderId}` }),
  });
  const unit = body.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  return {
    orderId: body.id ?? '',
    status: body.status ?? '',
    captureId: capture?.id ?? '',
    captureStatus: capture?.status ?? '',
    cents: centsOf(capture?.amount?.value),
    currency: capture?.amount?.currency_code ?? '',
    customId: capture?.custom_id ?? unit?.custom_id ?? '',
    payee: unit?.payee?.merchant_id ?? '',
  };
}

function urlSafe(s: string): string {
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** PayPal's note that BohdiAI acts for this maker's account (an unsigned token, by PayPal's design). */
export function actingFor(config: PayPalConfig, merchantId: string): string {
  return `${urlSafe(JSON.stringify({ alg: 'none' }))}.${urlSafe(JSON.stringify({ iss: config.clientId, payer_id: merchantId }))}.`;
}

/** Give a captured payment back in full, from the maker's account. Returns PayPal's refund ID. */
export async function refundCapture(config: PayPalConfig, token: string, captureId: string, merchantId: string, fetcher: Fetcher = fetch): Promise<string> {
  const body = await call<{ id?: string; status?: string }>(fetcher, `${paypalBase(config)}/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, {
    method: 'POST',
    headers: headers(config, token, { 'PayPal-Auth-Assertion': actingFor(config, merchantId), 'PayPal-Request-Id': `refund-${captureId}` }),
    body: '{}',
  });
  if (!body.id || (body.status !== 'COMPLETED' && body.status !== 'PENDING')) throw new PayPalError(`PayPal refund ${body.status ?? 'unknown'}`, 502);
  return body.id;
}
