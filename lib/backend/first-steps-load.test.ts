import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

/** A stand-in for a Supabase query: any chain of calls, awaited, gives the table's result. */
function chain(result: unknown): unknown {
  const p: unknown = new Proxy(() => undefined, {
    get(_t, prop) {
      if (prop === 'then') return (ok: (v: unknown) => unknown, bad: (e: unknown) => unknown) => Promise.resolve(result).then(ok, bad);
      return () => p;
    },
  });
  return p;
}

const rows = vi.hoisted(() => ({ byTable: new Map<string, unknown>(), square: null as unknown, paypal: null as unknown }));
vi.mock('@/lib/square/connection', () => ({ squareLink: async () => rows.square }));
vi.mock('@/lib/paypal/connection', () => ({ paypalLink: async () => rows.paypal }));

import { loadStepFacts } from './first-steps';

const ok = (data: unknown, count?: number): unknown => ({ data, error: null, count });
const db = { from: (t: string) => chain(rows.byTable.get(t) ?? ok(null)) } as unknown as SupabaseClient<Database>;

beforeEach(() => {
  rows.byTable = new Map();
  rows.square = null;
  rows.paypal = null;
});

describe('loadStepFacts', () => {
  it('reads an empty site as a fresh start', async () => {
    const f = await loadStepFacts(db, db, 't1', { draft: true, next: null });
    expect(f).toEqual({
      draft: true,
      headline: '',
      bio: '',
      phone: '',
      socials: 0,
      galleryPicks: 0,
      unpriced: 0,
      squareConnected: false,
      onlinePayments: false,
      nextEvent: null,
      collections: 0,
      morePhotos: false,
      promotions: 0,
    });
  });

  it('counts what she has done, and the pieces still without a price', async () => {
    rows.byTable.set('site_moments', ok({ headline: 'Barn wood' }));
    rows.byTable.set('site_profiles', ok({ bio: 'I build things.' }));
    rows.byTable.set('site_contacts', ok({ phone: '705 555 0101' }));
    rows.byTable.set('site_socials', ok(null, 2));
    rows.byTable.set('listings', ok([
      { base_price_cents: 2500, media_ids: ['a', 'b'], in_gallery: true, listing_variants: [] },
      { base_price_cents: 0, media_ids: ['a'], in_gallery: false, listing_variants: [{ price_cents: 1800, status: 'active' }] },
      { base_price_cents: null, media_ids: [], in_gallery: false, listing_variants: [{ price_cents: 900, status: 'archived' }] },
    ]));
    rows.byTable.set('collections', ok(null, 1));
    rows.byTable.set('promotions', ok(null, 3));
    rows.byTable.set('market_listings', ok(null, 4));
    const f = await loadStepFacts(db, db, 't1', { draft: false, next: { id: 'e1', name: 'Harvest Fair' } });
    expect(f).toMatchObject({ headline: 'Barn wood', bio: 'I build things.', phone: '705 555 0101', socials: 2, galleryPicks: 1, unpriced: 1, collections: 1, promotions: 3, morePhotos: true });
    expect(f.nextEvent).toEqual({ id: 'e1', name: 'Harvest Fair', bringing: 4 });
  });

  it('takes any one way to get paid as online payments, and Square as Square', async () => {
    rows.square = { locationId: 'L1' };
    let f = await loadStepFacts(db, db, 't1', { draft: false, next: null });
    expect(f).toMatchObject({ squareConnected: true, onlinePayments: true });
    rows.square = null;
    rows.paypal = { merchantId: 'M1' };
    f = await loadStepFacts(db, db, 't1', { draft: false, next: null });
    expect(f).toMatchObject({ squareConnected: false, onlinePayments: true });
    rows.paypal = null;
    rows.byTable.set('tenants', ok({ stripe_account_id: 'acct_1' }));
    f = await loadStepFacts(db, db, 't1', { draft: false, next: null });
    expect(f.onlinePayments).toBe(true);
  });

  it('says what couldn’t load instead of guessing', async () => {
    rows.byTable.set('site_moments', { data: null, error: { message: 'down' } });
    await expect(loadStepFacts(db, db, 't1', { draft: false, next: null })).rejects.toThrow('Could not load your headline: down');
    rows.byTable = new Map([['promotions', { data: null, error: { message: 'gone' }, count: null }]]);
    await expect(loadStepFacts(db, db, 't1', { draft: false, next: null })).rejects.toThrow('Could not load your promotions: gone');
  });
});
