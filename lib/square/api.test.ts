import { describe, it, expect, vi } from 'vitest';
import { authorizeUrl, cancelKeys, findSale, openLocations, renewKeys, swapCode, SquareError } from './api';
import { squareConfig } from './config';

const config = { applicationId: 'app-id', applicationSecret: 'app-secret', tokenKey: 'k', sandbox: false };

function answer(status: number, body: unknown): typeof fetch {
  return vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
}

describe('squareConfig', () => {
  it('needs every setting, and a known mode', () => {
    const env = { SQUARE_APPLICATION_ID: 'a', SQUARE_APPLICATION_SECRET: 's', SQUARE_TOKEN_KEY: 'k', SQUARE_ENV: 'sandbox' };
    expect(squareConfig(env)).toEqual({ applicationId: 'a', applicationSecret: 's', tokenKey: 'k', sandbox: true });
    expect(squareConfig({ ...env, SQUARE_ENV: 'live' })).toBeNull();
    expect(squareConfig({ ...env, SQUARE_TOKEN_KEY: undefined })).toBeNull();
  });
});

describe('authorizeUrl', () => {
  it('asks for the fewest permissions and a fresh sign-in', () => {
    const u = new URL(authorizeUrl(config, 'st'));
    expect(u.origin).toBe('https://connect.squareup.com');
    expect(u.searchParams.get('scope')).toBe('MERCHANT_PROFILE_READ ORDERS_READ PAYMENTS_READ');
    expect(u.searchParams.get('session')).toBe('false');
    expect(u.searchParams.get('state')).toBe('st');
  });

  it('uses Square’s test copy while testing', () => {
    expect(authorizeUrl({ ...config, sandbox: true }, 'st')).toMatch(/^https:\/\/connect\.squareupsandbox\.com\/oauth2\/authorize\?/);
  });
});

describe('keys', () => {
  it('swaps a code for keys, sending the secret only to Square', async () => {
    const fetcher = answer(200, { access_token: 'A', refresh_token: 'R', expires_at: '2026-11-20T00:00:00Z', merchant_id: 'M' });
    expect(await swapCode(config, 'code', fetcher)).toEqual({ accessToken: 'A', refreshToken: 'R', expiresAt: '2026-11-20T00:00:00Z', merchantId: 'M' });
    const [url, init] = (fetcher as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0] ?? [];
    expect(url).toBe('https://connect.squareup.com/oauth2/token');
    expect(JSON.parse(String(init?.body))).toMatchObject({ grant_type: 'authorization_code', code: 'code', client_secret: 'app-secret' });
  });

  it('keeps the renewal key when Square doesn’t send a new one', async () => {
    const keys = await renewKeys(config, 'R-old', answer(200, { access_token: 'A2', expires_at: '2026-12-20T00:00:00Z', merchant_id: 'M' }));
    expect(keys.refreshToken).toBe('R-old');
  });

  it('refuses an incomplete answer and passes on Square’s error code only', async () => {
    await expect(swapCode(config, 'c', answer(200, { access_token: 'A' }))).rejects.toThrow(SquareError);
    await expect(swapCode(config, 'c', answer(401, { errors: [{ code: 'UNAUTHORIZED', detail: 'secret echoed here' }] }))).rejects.toThrow(/^Square 401 UNAUTHORIZED$/);
  });

  it('cancels every key for the business with the app secret', async () => {
    const fetcher = answer(200, { success: true });
    await cancelKeys(config, 'M', fetcher);
    const [, init] = (fetcher as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0] ?? [];
    expect((init?.headers as Record<string, string>)['Authorization']).toBe('Client app-secret');
    expect(JSON.parse(String(init?.body))).toEqual({ client_id: 'app-id', merchant_id: 'M' });
  });
});

describe('reads', () => {
  it('lists only open locations', async () => {
    const locs = await openLocations(config, 'A', answer(200, { locations: [{ id: 'L1', name: 'Booth', status: 'ACTIVE' }, { id: 'L2', name: 'Old', status: 'INACTIVE' }] }));
    expect(locs).toEqual([{ id: 'L1', name: 'Booth' }]);
  });

  it('finds a sale’s order and its card payments, and none when Square has no such order', async () => {
    const sale = await findSale(
      config,
      'A',
      'ORD',
      answer(200, { order: { id: 'ORD', location_id: 'L1', state: 'COMPLETED', total_money: { amount: 4250, currency: 'USD' }, tenders: [{ payment_id: 'P1', type: 'CARD', amount_money: { amount: 4250 } }] } }),
    );
    expect(sale).toEqual({ orderId: 'ORD', locationId: 'L1', state: 'COMPLETED', totalCents: 4250, currency: 'USD', payments: [{ id: 'P1', amountCents: 4250, type: 'CARD' }] });
    expect(await findSale(config, 'A', 'NOPE', answer(404, { errors: [{ code: 'NOT_FOUND' }] }))).toBeNull();
  });
});
