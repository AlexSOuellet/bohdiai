import { describe, it, expect } from 'vitest';
import { canOpenSquare, readSquareReturn, saleMatches, squareHandOff, wasCanceled } from './pos';

const args = {
  applicationId: 'sq0idp-app',
  callbackUrl: 'https://app.bohdiai.com/api/square/pos',
  totalCents: 4250,
  note: 'Saltmarsh & Lace · Wickford Art Fair',
  locationId: 'LOC1',
  state: 'signed.note',
  fallbackUrl: 'https://app.bohdiai.com/manage/markets/m1/day?card=no-app',
};

describe('squareHandOff', () => {
  it('opens Square on an iPhone with the total, cards only (reader or typed in)', () => {
    const { iphone } = squareHandOff(args);
    expect(iphone.startsWith('square-commerce-v1://payment/create?data=')).toBe(true);
    const data = JSON.parse(decodeURIComponent(iphone.split('data=')[1] ?? '')) as Record<string, unknown>;
    expect(data).toMatchObject({
      amount_money: { amount: '4250', currency_code: 'USD' },
      callback_url: args.callbackUrl,
      client_id: 'sq0idp-app',
      version: '1.3',
      state: 'signed.note',
      location_id: 'LOC1',
      options: { supported_tender_types: ['CARD_FROM_READER', 'KEYED_IN_CARD'] },
    });
  });

  it('opens Square on Android with the same sale, every value encoded', () => {
    const { android } = squareHandOff(args);
    expect(android.startsWith('intent:#Intent;action=com.squareup.pos.action.CHARGE;package=com.squareup;')).toBe(true);
    expect(android.endsWith(';end')).toBe(true);
    expect(android).toContain('i.com.squareup.pos.TOTAL_AMOUNT=4250;');
    expect(android).toContain('S.com.squareup.pos.TENDER_TYPES=com.squareup.pos.TENDER_CARD;');
    expect(android).toContain(`S.com.squareup.pos.NOTE=${encodeURIComponent(args.note)};`);
    expect(android).toContain('S.com.squareup.pos.LOCATION_ID=LOC1;');
  });

  it('tells Square on Android to come back on its own, within the time Square allows', () => {
    const m = squareHandOff(args).android.match(/;l\.com\.squareup\.pos\.AUTO_RETURN_TIMEOUT_MS=(\d+);/);
    expect(m).not.toBeNull();
    const ms = Number(m?.[1]);
    expect(ms).toBeGreaterThanOrEqual(3200);
    expect(ms).toBeLessThanOrEqual(10000);
  });

  it('leaves the location to Square when none is picked', () => {
    const h = squareHandOff({ ...args, locationId: null });
    expect(h.android).not.toContain('LOCATION_ID');
    expect(decodeURIComponent(h.iphone)).not.toContain('location_id');
  });
});

describe('readSquareReturn', () => {
  const ios = (d: object): URLSearchParams => new URLSearchParams({ data: JSON.stringify(d) });

  it('reads an iPhone sale, an offline one, a failure and nonsense', () => {
    expect(readSquareReturn(ios({ status: 'ok', transaction_id: 'ORD1', state: 's' }))).toEqual({ kind: 'paid', orderId: 'ORD1', state: 's' });
    expect(readSquareReturn(ios({ status: 'ok', client_transaction_id: 'C1', state: 's' }))).toEqual({ kind: 'offline', state: 's' });
    expect(readSquareReturn(ios({ status: 'error', error_code: 'payment_canceled', state: 's' }))).toEqual({ kind: 'failed', code: 'payment_canceled', state: 's' });
    expect(readSquareReturn(new URLSearchParams({ data: '{not json' }))).toBeNull();
    expect(readSquareReturn(ios({ status: 'ok', state: 's' }))).toBeNull();
  });

  it('reads an Android sale, an offline one and a failure', () => {
    const a = (o: Record<string, string>): URLSearchParams => new URLSearchParams(Object.fromEntries(Object.entries(o).map(([k, v]) => [`com.squareup.pos.${k}`, v])));
    expect(readSquareReturn(a({ SERVER_TRANSACTION_ID: 'ORD2', REQUEST_METADATA: 's' }))).toEqual({ kind: 'paid', orderId: 'ORD2', state: 's' });
    expect(readSquareReturn(a({ CLIENT_TRANSACTION_ID: 'C2', REQUEST_METADATA: 's' }))).toEqual({ kind: 'offline', state: 's' });
    expect(readSquareReturn(a({ ERROR_CODE: 'com.squareup.pos.ERROR_TRANSACTION_CANCELED', REQUEST_METADATA: 's' }))).toEqual({
      kind: 'failed',
      code: 'com.squareup.pos.ERROR_TRANSACTION_CANCELED',
      state: 's',
    });
    expect(readSquareReturn(new URLSearchParams())).toBeNull();
  });

  it('knows a cancel from a real failure', () => {
    expect(wasCanceled('payment_canceled')).toBe(true);
    expect(wasCanceled('com.squareup.pos.ERROR_TRANSACTION_CANCELED')).toBe(true);
    expect(wasCanceled('no_network_connection')).toBe(false);
  });
});

describe('saleMatches', () => {
  const sale = { state: 'COMPLETED', totalCents: 4250, currency: 'USD', locationId: 'LOC1', payments: [{ type: 'CARD', amountCents: 4250 }] };

  it('accepts a completed card sale for the exact total at the location', () => {
    expect(saleMatches(sale, { totalCents: 4250, locationId: 'LOC1' })).toBe(true);
  });

  it('refuses anything else', () => {
    expect(saleMatches({ ...sale, state: 'OPEN' }, { totalCents: 4250, locationId: 'LOC1' })).toBe(false);
    expect(saleMatches(sale, { totalCents: 4251, locationId: 'LOC1' })).toBe(false);
    expect(saleMatches(sale, { totalCents: 4250, locationId: 'LOC2' })).toBe(false);
    expect(saleMatches({ ...sale, currency: 'CAD' }, { totalCents: 4250, locationId: 'LOC1' })).toBe(false);
    expect(saleMatches({ ...sale, payments: [{ type: 'CASH', amountCents: 4250 }] }, { totalCents: 4250, locationId: 'LOC1' })).toBe(false);
  });
});

describe('canOpenSquare', () => {
  it('knows phones and tablets, an iPad included, from a computer', () => {
    expect(canOpenSquare('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36', 5)).toBe(true);
    expect(canOpenSquare('Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 Chrome/130 Safari/537.36', 10)).toBe(true);
    expect(canOpenSquare('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148', 5)).toBe(true);
    // An iPad's browser calls itself a Mac; it takes touches.
    expect(canOpenSquare('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15', 5)).toBe(true);
    expect(canOpenSquare('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15', 0)).toBe(false);
    expect(canOpenSquare('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36', 0)).toBe(false);
  });
});
