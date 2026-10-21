import { describe, it, expect, vi } from 'vitest';
import { CONNECT_PURPOSE, checkConnectNote, connectReturnUrl, cardReturnUrl, readCardNote } from './flow';
import { CARD_SALE_PURPOSE } from './pos';
import { signNote } from './vault';

vi.mock('@/lib/supabase', () => ({ supabaseAdmin: vi.fn() }));

const KEY = btoa(String.fromCharCode(...new Uint8Array(32).map((_, i) => i + 7)));
const config = { applicationId: 'a', applicationSecret: 's', tokenKey: KEY, sandbox: true };
const NOW = 1_800_000_000_000;

describe('return addresses', () => {
  it('come back to the backend’s own host', () => {
    expect(connectReturnUrl('https://bohdiai.com')).toBe('https://app.bohdiai.com/api/square/oauth');
    expect(cardReturnUrl('https://bohdiai.com')).toBe('https://app.bohdiai.com/api/square/pos');
  });
});

describe('checkConnectNote', () => {
  const note = { tenantId: 't1', userId: 'u1', nonce: 'n1', expires: NOW + 60_000 };

  it('accepts its own note, from the same browser and person, in time', async () => {
    const state = await signNote(CONNECT_PURPOSE, note, KEY);
    expect(await checkConnectNote(config, state, 'n1', 'u1', NOW)).toEqual(note);
  });

  it('refuses another browser, another person, a late return or a forged note', async () => {
    const state = await signNote(CONNECT_PURPOSE, note, KEY);
    expect(await checkConnectNote(config, state, undefined, 'u1', NOW)).toBeNull();
    expect(await checkConnectNote(config, state, 'n2', 'u1', NOW)).toBeNull();
    expect(await checkConnectNote(config, state, 'n1', 'u2', NOW)).toBeNull();
    expect(await checkConnectNote(config, state, 'n1', 'u1', NOW + 120_000)).toBeNull();
    const forged = await signNote(CONNECT_PURPOSE, { ...note, tenantId: 't2' }, btoa('x'.repeat(32)));
    expect(await checkConnectNote(config, forged, 'n1', 'u1', NOW)).toBeNull();
    const cardNote = await signNote(CARD_SALE_PURPOSE, note, KEY);
    expect(await checkConnectNote(config, cardNote, 'n1', 'u1', NOW)).toBeNull();
  });
});

describe('readCardNote', () => {
  const sale = { tenantId: 't1', eventId: 'e1', nonce: 'n', lines: [{ listingId: 'l1', variantId: null, quantity: 2 }], totalCents: 5000, expires: NOW + 60_000 };

  it('reads its own card sale in time', async () => {
    expect(await readCardNote(config, await signNote(CARD_SALE_PURPOSE, sale, KEY), NOW)).toEqual(sale);
  });

  it('refuses a late, malformed or connect note', async () => {
    expect(await readCardNote(config, await signNote(CARD_SALE_PURPOSE, sale, KEY), NOW + 120_000)).toBeNull();
    expect(await readCardNote(config, await signNote(CARD_SALE_PURPOSE, { ...sale, lines: [{ listingId: 'l1' }] }, KEY), NOW)).toBeNull();
    expect(await readCardNote(config, await signNote(CONNECT_PURPOSE, sale, KEY), NOW)).toBeNull();
  });
});
