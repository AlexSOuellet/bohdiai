// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as Connection from '@/lib/paypal/connection';

const SITE = '3a880ace-f21c-498e-9a92-477ba31d41f8';
const CODE = '0b9c2f1e-6d4a-4c1b-9e2f-7a8b9c0d1e2f';
const s = vi.hoisted(() => ({
  features: new Set<string>(['cart']),
  configured: true,
  cookie: undefined as string | undefined,
  merchant: 'M1' as string | null,
  status: null as unknown,
  linkFails: false,
  statusFails: false,
  saved: vi.fn(),
}));
vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: SITE }, sites: [{ tenantId: SITE }] }) }));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => s.features }));
vi.mock('@/lib/env', () => ({ serverEnv: () => ({ SITE_URL: 'https://bohdiai.com' }) }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({}) }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => (s.cookie === undefined ? undefined : { value: s.cookie }) }) }));
vi.mock('@/lib/paypal/config', () => ({ paypalConfig: () => (s.configured ? { clientId: 'client', clientSecret: 'x', partnerMerchantId: 'P', sandbox: true, attributionId: null } : null) }));
vi.mock('@/lib/paypal/api', () => ({
  partnerToken: async () => 'T',
  signUpLink: async (_c: unknown, _t: unknown, tracking: string, back: string) => {
    if (s.linkFails) throw new Error('PayPal 500');
    return `https://www.sandbox.paypal.com/signup?t=${tracking}&back=${encodeURIComponent(back)}`;
  },
  merchantFor: async () => s.merchant,
  merchantStatus: async () => {
    if (s.statusFails) throw new Error('PayPal 500');
    return s.status;
  },
}));
vi.mock('@/lib/paypal/connection', async (orig) => ({ ...(await orig<typeof Connection>()), saveConnection: async (...a: unknown[]) => s.saved(...a) }));

const connect = (await import('./connect/route')).GET;
const back = (await import('./return/route')).GET;
const ready = { merchantId: 'M1', email: 'renee@example.com', paymentsReceivable: true, emailConfirmed: true, permissionsGranted: true, cardsApproved: false };
const outcome = (res: Response): string | null => new URL(res.headers.get('location') ?? 'https://x').searchParams.get('paypal');

beforeEach(() => {
  s.features = new Set(['cart']);
  s.configured = true;
  s.cookie = CODE;
  s.merchant = 'M1';
  s.status = ready;
  s.linkFails = false;
  s.statusFails = false;
  s.saved.mockReset();
});

describe('Connect PayPal', () => {
  it('sends her to PayPal’s page with this site in the tracking ID and a code on this browser', async () => {
    const res = await connect(new Request('https://app.bohdiai.com/api/paypal/connect'));
    const to = new URL(res.headers.get('location') ?? '');
    expect(to.host).toBe('www.sandbox.paypal.com');
    const tracking = to.searchParams.get('t') ?? '';
    expect(tracking.startsWith(`${SITE}.`)).toBe(true);
    expect(to.searchParams.get('back')).toMatch(/\/api\/paypal\/return$/);
    const cookie = res.headers.get('set-cookie') ?? '';
    expect(cookie).toContain(`bohdi_paypal_connect=${tracking.split('.')[1]}`);
    expect(cookie).toContain('HttpOnly');
  });
  it('stays on Getting paid without the cart, or with PayPal not set up, or when PayPal fails', async () => {
    s.features = new Set();
    expect(outcome(await connect(new Request('https://app.bohdiai.com/api/paypal/connect')))).toBeNull();
    s.features = new Set(['cart']);
    s.configured = false;
    expect(outcome(await connect(new Request('https://app.bohdiai.com/api/paypal/connect')))).toBe('not-set-up');
    s.configured = true;
    s.linkFails = true;
    expect(outcome(await connect(new Request('https://app.bohdiai.com/api/paypal/connect')))).toBe('failed');
  });
});

describe('back from PayPal', () => {
  const url = (extra = ''): Request => new Request(`https://app.bohdiai.com/api/paypal/return?merchantId=${SITE}.${CODE}&merchantIdInPayPal=SPOOF&permissionsGranted=true${extra}`);
  it('saves the account PayPal itself names, never the address’s', async () => {
    const res = await back(url());
    expect(outcome(res)).toBe('connected');
    expect(s.saved).toHaveBeenCalledWith(expect.anything(), SITE, ready);
    expect(res.headers.get('set-cookie') ?? '').toContain('bohdi_paypal_connect=;');
  });
  it('connects an account that can’t take payments yet, and says so', async () => {
    s.status = { ...ready, paymentsReceivable: false };
    expect(outcome(await back(url()))).toBe('not-ready');
    expect(s.saved).toHaveBeenCalled();
  });
  it('refuses another browser, a made-up site, an unfinished sign-up, or no permission', async () => {
    s.cookie = undefined;
    expect(outcome(await back(url()))).toBe('expired');
    s.cookie = CODE;
    expect(outcome(await back(new Request(`https://app.bohdiai.com/api/paypal/return?merchantId=11111111-1111-4111-8111-111111111111.${CODE}`)))).toBe('expired');
    s.merchant = null;
    expect(outcome(await back(url()))).toBe('unfinished');
    s.merchant = 'M1';
    s.status = { ...ready, permissionsGranted: false };
    expect(outcome(await back(url()))).toBe('declined');
    expect(outcome(await back(new Request('https://app.bohdiai.com/api/paypal/return?permissionsGranted=false')))).toBe('declined');
    expect(s.saved).not.toHaveBeenCalled();
  });
  it('says so when PayPal isn’t set up or fails', async () => {
    s.configured = false;
    expect(outcome(await back(url()))).toBe('not-set-up');
    s.configured = true;
    s.statusFails = true;
    expect(outcome(await back(url()))).toBe('failed');
  });
});
