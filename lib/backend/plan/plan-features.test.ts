import { describe, it, expect } from 'vitest';
import { FEATURES } from '../features';
import { PLAN_FEATURES, PLAN_MANAGED, hiddenByMove, moveOf, planFeatureRows } from './plan-features';
import { applyPlan } from './apply';

describe('what each plan switches on', () => {
  it('gives Showcase dates-only markets and no shop', () => {
    expect([...PLAN_FEATURES.showcase].sort()).toEqual(['gallery', 'market_dates', 'plan', 'profile', 'qr_codes']);
  });

  it('adds the catalog and the point of sale at Lite, and market records only at Full', () => {
    expect(PLAN_FEATURES.lite).toEqual(expect.arrayContaining(['catalog', 'market_details', 'market_shop']));
    expect(PLAN_FEATURES.lite).not.toContain('market_records');
    expect(PLAN_FEATURES.full).toEqual(expect.arrayContaining(['cart', 'promotions', 'new_arrivals', 'market_records']));
  });

  it('builds on the plan below, and only names real switches', () => {
    for (const k of PLAN_FEATURES.showcase) expect(PLAN_FEATURES.lite).toContain(k);
    for (const k of PLAN_FEATURES.lite) expect(PLAN_FEATURES.full).toContain(k);
    for (const k of PLAN_MANAGED) expect(Object.keys(FEATURES)).toContain(k);
  });

  it('never touches the switches the plans don’t decide', () => {
    for (const k of ['demo_checkout', 'custom_domain_panel', 'video', 'digital_products']) expect(PLAN_MANAGED).not.toContain(k);
  });

  it('writes every managed switch, on or off', () => {
    const rows = planFeatureRows('showcase');
    expect(rows).toHaveLength(PLAN_MANAGED.length);
    expect(rows.find((r) => r.feature_key === 'catalog')?.enabled).toBe(false);
    expect(rows.find((r) => r.feature_key === 'gallery')?.enabled).toBe(true);
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
      'Your products and collections, with prices',
      'Market hours, addresses, booths and websites',
      'The point of sale at markets: the QR shop page, Getting paid and Today',
      'The cart and online orders',
      'Sales and discount codes',
      'New arrivals on your home page',
      'Market costs, organizer details, notes and reviews',
    ]);
    expect(hiddenByMove('showcase', 'full')).toEqual([]);
  });
});

type Call = { table: string; op: string; arg: unknown };
function fakeDb(fail: { upsert?: string; update?: string } = {}) {
  const calls: Call[] = [];
  const db = {
    from: (table: string) => ({
      upsert: (arg: unknown) => {
        calls.push({ table, op: 'upsert', arg });
        return Promise.resolve({ error: fail.upsert === undefined ? null : { message: fail.upsert } });
      },
      update: (arg: unknown) => ({
        eq: () => {
          calls.push({ table, op: 'update', arg });
          return Promise.resolve({ error: fail.update === undefined ? null : { message: fail.update } });
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
    expect(calls.map((c) => `${c.table}.${c.op}`)).toEqual(['tenant_features.upsert', 'tenants.update']);
    expect(calls[0]?.arg).toContainEqual({ tenant_id: 't1', feature_key: 'catalog', enabled: true });
    expect(calls[1]?.arg).toEqual({ plan: 'lite' });
  });

  it('stops and says which write failed', async () => {
    expect(await applyPlan(fakeDb({ upsert: 'down' }).db, 't1', 'lite')).toEqual({ ok: false, error: 'switches: down' });
    expect(await applyPlan(fakeDb({ update: 'nope' }).db, 't1', 'lite')).toEqual({ ok: false, error: 'plan: nope' });
  });
});
