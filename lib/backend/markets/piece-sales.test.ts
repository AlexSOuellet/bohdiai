import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { loadPieceResults, pieceResults } from './piece-sales';

describe('pieceResults', () => {
  it('counts each piece at each market, and notes when a counted one sold out', () => {
    const rows = pieceResults(
      [
        { eventId: 'e1', listingId: 'a', variantId: null, name: 'Mug', brought: 3 },
        { eventId: 'e1', listingId: 'b', variantId: 'v', name: 'Scarf, Blue', brought: 2 },
        { eventId: 'e1', listingId: 'z', variantId: null, name: 'Stayed home', brought: 0 },
      ],
      [
        { eventId: 'e1', listingId: 'a', variantId: null, name: 'Mug', quantity: 2, at: '2026-10-20T15:00:00Z' },
        { eventId: 'e1', listingId: 'a', variantId: null, name: 'Mug', quantity: 1, at: '2026-10-20T14:00:00Z' },
        { eventId: 'e1', listingId: 'b', variantId: 'v', name: 'Scarf, Blue', quantity: 1, at: '2026-10-20T16:00:00Z' },
        { eventId: 'e1', listingId: 'c', variantId: null, name: 'Card', quantity: 4, at: '2026-10-20T13:00:00Z' },
      ],
    );
    expect(rows).toEqual([
      { eventId: 'e1', key: 'a', name: 'Mug', brought: 3, sold: 3, left: 0, soldOutAt: '2026-10-20T15:00:00Z' },
      { eventId: 'e1', key: 'b:v', name: 'Scarf, Blue', brought: 2, sold: 1, left: 1, soldOutAt: null },
      { eventId: 'e1', key: 'z', name: 'Stayed home', brought: 0, sold: 0, left: 0, soldOutAt: null },
      { eventId: 'e1', key: 'c', name: 'Card', brought: null, sold: 4, left: null, soldOutAt: null },
    ]);
  });
});

function db(answers: Record<string, { data: unknown; error: { message: string } | null }>, calls: string[] = []): SupabaseClient<Database> {
  const chain = (table: string): unknown => {
    const p: unknown = new Proxy(() => undefined, {
      get(_t, prop) {
        if (prop === 'then') return (ok: (v: unknown) => unknown) => Promise.resolve(answers[table] ?? { data: [], error: null }).then(ok);
        return (...args: unknown[]) => {
          calls.push(`${table}.${String(prop)}(${args.map((a) => JSON.stringify(a)).join(',')})`);
          return p;
        };
      },
    });
    return p;
  };
  return { from: (t: string) => chain(t) } as unknown as SupabaseClient<Database>;
}

describe('loadPieceResults', () => {
  it('reads what she brought and her paid market sales, for one market or all', async () => {
    const calls: string[] = [];
    const d = db(
      {
        market_stock: {
          data: [
            { event_id: 'e1', listing_id: 'a', listing_variant_id: null, brought: 1, listings: { name: 'Mug' }, listing_variants: null },
            { event_id: 'e1', listing_id: 'b', listing_variant_id: 'v', brought: 1, listings: null, listing_variants: { option_combination: { Colour: 'Blue' } } },
          ],
          error: null,
        },
        orders: {
          data: [
            { event_id: 'e1', paid_at: '2026-10-20T15:00:00Z', created_at: '2026-10-20T14:00:00Z', order_items: [{ listing_id: 'a', listing_variant_id: null, name_snapshot: 'Mug', variant_description_snapshot: null, quantity: 1 }, { listing_id: null, listing_variant_id: null, name_snapshot: 'x', variant_description_snapshot: null, quantity: 1 }] },
            { event_id: 'e1', paid_at: null, created_at: '2026-10-20T16:00:00Z', order_items: [{ listing_id: 'b', listing_variant_id: 'v', name_snapshot: 'Scarf', variant_description_snapshot: 'Blue', quantity: 1 }] },
            { event_id: null, paid_at: null, created_at: '2026-10-20T16:00:00Z', order_items: [] },
          ],
          error: null,
        },
      },
      calls,
    );
    const rows = await loadPieceResults(d, 't', 'e1');
    expect(rows.map((r) => [r.name, r.soldOutAt])).toEqual([
      ['Mug', '2026-10-20T15:00:00Z'],
      [', Blue', '2026-10-20T16:00:00Z'],
    ]);
    expect(calls).toContain('market_stock.eq("event_id","e1")');
    const all: string[] = [];
    await loadPieceResults(db({}, all), 't', null);
    expect(all.some((c) => c.includes('"event_id","e1"'))).toBe(false);
  });
  it('says what couldn’t load', async () => {
    await expect(loadPieceResults(db({ market_stock: { data: null, error: { message: 'x' } } }), 't', null)).rejects.toThrow('what you brought');
    await expect(loadPieceResults(db({ orders: { data: null, error: { message: 'x' } } }), 't', null)).rejects.toThrow('market sales');
    expect(await loadPieceResults(db({ market_stock: { data: null, error: null }, orders: { data: null, error: null } }), 't', null)).toEqual([]);
  });
});
