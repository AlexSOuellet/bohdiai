import { describe, it, expect } from 'vitest';
import { FEATURES } from '../features';
import {
  PLAN_FEATURES,
  PLAN_MANAGED,
  hiddenByMove,
  moveOf,
  planFeatureRows,
} from './plan-features';
import { applyPlan } from './apply';

describe('what each plan switches on', () => {
  it('gives Showcase its catalog with no shop, its headline, and dates-only markets', () => {
    expect([...PLAN_FEATURES.showcase].sort()).toEqual([
      'background',
      'gallery_pieces',
      'headline',
      'market_dates',
      'plan',
      'profile',
      'qr_codes',
    ]);
  });

  it('gives every plan the headline', () => {
    for (const plan of ['showcase', 'lite', 'full'] as const) expect(PLAN_FEATURES[plan]).toContain('headline');
  });

  it('gives Market the catalog and the whole market app, and keeps collections and online selling for Full', () => {
    expect(PLAN_FEATURES.lite).toEqual(
      expect.arrayContaining(['catalog', 'market_details', 'market_shop', 'market_records', 'testimonials']),
    );
    for (const k of ['collections', 'cart', 'promotions', 'product_photos', 'new_arrivals'] as const) expect(PLAN_FEATURES.lite).not.toContain(k);
    expect(PLAN_FEATURES.full).toEqual(
      expect.arrayContaining(['collections', 'cart', 'promotions', 'new_arrivals', 'market_records']),
    );
  });

  it('builds on the plan below, and only names real switches', () => {
    // Showcase's gallery from the catalog gives way to the shop itself on Market.
    for (const k of PLAN_FEATURES.showcase) expect(PLAN_FEATURES.lite).toContain(k === 'gallery_pieces' ? 'catalog' : k);
    expect(PLAN_FEATURES.lite).not.toContain('gallery_pieces');
    for (const k of PLAN_FEATURES.lite) expect(PLAN_FEATURES.full).toContain(k);
    for (const k of PLAN_MANAGED) expect(Object.keys(FEATURES)).toContain(k);
  });

  it('never touches the switches the plans don’t decide', () => {
    for (const k of ['demo_checkout', 'custom_domain_panel', 'video']) expect(PLAN_MANAGED).not.toContain(k);
    expect(PLAN_MANAGED).toContain('digital_products');
  });

  it('writes every managed switch, on or off', () => {
    const rows = planFeatureRows('showcase');
    expect(rows).toHaveLength(PLAN_MANAGED.length);
    expect(rows.find((r) => r.feature_key === 'catalog')?.enabled).toBe(false);
    expect(rows.find((r) => r.feature_key === 'gallery_pieces')?.enabled).toBe(true);
    // The old Gallery screen of loose photos is off on Showcase and back on above it.
    expect(rows.find((r) => r.feature_key === 'gallery')?.enabled).toBe(false);
    expect(planFeatureRows('lite').find((r) => r.feature_key === 'gallery_pieces')?.enabled).toBe(false);
  });
});

describe('moving between plans', () => {
  it('knows up from down', () => {
    expect(moveOf('showcase', 'full')).toBe('up');
    expect(moveOf('full', 'lite')).toBe('down');
    expect(moveOf('lite', 'lite')).toBe('same');
  });

  it('names what a move down puts away, and nothing for a move up', () => {
    expect(hiddenByMove('full', 'showcase')).toEqual([
      'Your shop page and prices (your products are kept)',
      'Market hours, addresses, booths and websites',
      'The point of sale at markets: the QR shop page, Getting paid, Today and Orders',
      'Market costs, organizer details, notes and reviews',
      'Testimonials on your site',
      'Collections and their pages (your collections are kept)',
      'Every testimonial on your site (Market shows up to three; the rest are kept)',
      'Extra photos on each product (the main photo stays)',
      'Selling downloads (your download products are kept)',
      'The cart and online orders',
      'Sales and discount codes',
      'New arrivals on your home page',
      'Trying on other looks (the look you chose stays)',
      'Buyer accounts: your buyers can’t sign in (their accounts and orders are kept)',
    ]);
    expect(hiddenByMove('full', 'lite')).toEqual([
      'Collections and their pages (your collections are kept)',
      'Every testimonial on your site (Market shows up to three; the rest are kept)',
      'Extra photos on each product (the main photo stays)',
      'Selling downloads (your download products are kept)',
      'The cart and online orders',
      'Sales and discount codes',
      'New arrivals on your home page',
      'Trying on other looks (the look you chose stays)',
      'Buyer accounts: your buyers can’t sign in (their accounts and orders are kept)',
    ]);
    expect(hiddenByMove('showcase', 'full')).toEqual([]);
  });

  it('says how many buyers lose sign-in when she steps down from Full (Alex, 2026-10-25)', () => {
    expect(hiddenByMove('full', 'lite', 1).at(-1)).toBe('Buyer accounts: 1 buyer with an account at your shop won’t be able to sign in (their accounts and orders are kept, and sign-in comes back when you return to Full)');
    expect(hiddenByMove('full', 'lite', 12).at(-1)).toMatch(/^Buyer accounts: 12 buyers with an account/);
  });
});

type Call = { table: string; op: string; arg: unknown };
function fakeDb(fail: { upsert?: string; update?: string } = {}) {
  const calls: Call[] = [];
  const db = {
    from: (table: string) => ({
      upsert: (arg: unknown) => {
        calls.push({ table, op: 'upsert', arg });
        return Promise.resolve({
          error: fail.upsert === undefined ? null : { message: fail.upsert },
        });
      },
      update: (arg: unknown) => ({
        eq: () => {
          calls.push({ table, op: 'update', arg });
          return Promise.resolve({
            error: fail.update === undefined ? null : { message: fail.update },
          });
        },
      }),
    }),
  };
  return { db: db as unknown as Parameters<typeof applyPlan>[0], calls };
}

describe('applying a plan', () => {
  it('sets the switches, then stores the plan', async () => {
    const { db, calls } = fakeDb();
    expect(await applyPlan(db, 't1', 'lite')).toEqual({ ok: true });
    expect(calls.map((c) => `${c.table}.${c.op}`)).toEqual([
      'tenant_features.upsert',
      'tenants.update',
    ]);
    expect(calls[0]?.arg).toContainEqual({
      tenant_id: 't1',
      feature_key: 'catalog',
      enabled: true,
    });
    expect(calls[1]?.arg).toEqual({ plan: 'lite' });
  });

  it('stops and says which write failed', async () => {
    expect(await applyPlan(fakeDb({ upsert: 'down' }).db, 't1', 'lite')).toEqual({
      ok: false,
      error: 'switches: down',
    });
    expect(await applyPlan(fakeDb({ update: 'nope' }).db, 't1', 'lite')).toEqual({
      ok: false,
      error: 'plan: nope',
    });
  });
});

describe('the pages a link can point at', () => {
  it('Showcase has no shop and no collections; Market has no collections; Full has every page', async () => {
    const { planLinkTargets } = await import('./plan-features');
    const { LINK_TARGETS } = await import('@/lib/archetypes/main-street/links');
    expect(planLinkTargets('showcase')).toEqual(LINK_TARGETS.filter((t) => t !== 'shop' && t !== 'collections'));
    expect(planLinkTargets('lite')).toEqual(LINK_TARGETS.filter((t) => t !== 'collections'));
    expect(planLinkTargets('full')).toEqual(LINK_TARGETS);
  });
});
