import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { broughtToMarket, countKey, goneHere, leftOf, marketPieceStock, optionLabel, soldAtMarket } from './stock';

/** A stand-in Supabase answering by table. */
function db(answers: Record<string, { data: unknown; error: { message: string } | null }>): SupabaseClient<Database> {
  const chain = (table: string): unknown => {
    const p: unknown = new Proxy(() => undefined, {
      get(_t, prop) {
        if (prop === 'then') return (ok: (v: unknown) => unknown) => Promise.resolve(answers[table] ?? { data: [], error: null }).then(ok);
        return () => p;
      },
    });
    return p;
  };
  return { from: (t: string) => chain(t) } as unknown as SupabaseClient<Database>;
}

describe('leftOf', () => {
  it('is the fewest of what’s on hand and what’s left of what she brought', () => {
    expect(leftOf(null, null, 3)).toBeNull();
    expect(leftOf(5, null, 3)).toBe(5);
    expect(leftOf(null, 4, 1)).toBe(3);
    expect(leftOf(2, 4, 1)).toBe(2);
    expect(leftOf(9, 4, 6)).toBe(0);
    expect(leftOf(-1, null, 0)).toBe(0);
  });
});

describe('optionLabel', () => {
  it('words an option by its values, in a steady order', () => {
    expect(optionLabel({ Size: 'L', Colour: 'Blue' })).toBe('Blue / L');
    expect(optionLabel({ Colour: '' })).toBe('');
    expect(optionLabel(null)).toBe('');
    expect(optionLabel(['x'])).toBe('');
    expect(optionLabel({ n: 3 })).toBe('');
  });
});

describe('goneHere', () => {
  it('is gone when nothing is left, or every option is', () => {
    expect(goneHere(undefined)).toBe(false);
    expect(goneHere({ left: 0, options: [] })).toBe(true);
    expect(goneHere({ left: null, options: [] })).toBe(false);
    expect(goneHere({ left: null, options: [{ id: 'v', label: 'Blue', priceCents: null, left: 0 }] })).toBe(true);
    expect(goneHere({ left: null, options: [{ id: 'v', label: 'Blue', priceCents: null, left: 0 }, { id: 'w', label: 'Red', priceCents: null, left: null }] })).toBe(false);
  });
});

describe('reading a market’s counts', () => {
  it('adds up what sold there, by piece and option', async () => {
    const sold = await soldAtMarket(
      db({
        orders: {
          data: [
            { order_items: [{ listing_id: 'a', listing_variant_id: null, quantity: 2 }] },
            { order_items: [{ listing_id: 'a', listing_variant_id: null, quantity: 1 }, { listing_id: 'b', listing_variant_id: 'v', quantity: 1 }, { listing_id: null, listing_variant_id: null, quantity: 5 }] },
          ],
          error: null,
        },
      }),
      't',
      'e',
    );
    expect([...sold]).toEqual([
      ['a', 3],
      ['b:v', 1],
    ]);
    await expect(soldAtMarket(db({ orders: { data: null, error: { message: 'x' } } }), 't', 'e')).rejects.toThrow('sales');
    expect((await soldAtMarket(db({ orders: { data: null, error: null } }), 't', 'e')).size).toBe(0);
  });

  it('reads what she brought', async () => {
    const b = await broughtToMarket(db({ market_stock: { data: [{ listing_id: 'a', listing_variant_id: null, brought: 4 }, { listing_id: 'b', listing_variant_id: 'v', brought: 2 }], error: null } }), 'e');
    expect(b.get('a')).toBe(4);
    expect(b.get('b:v')).toBe(2);
    await expect(broughtToMarket(db({ market_stock: { data: null, error: { message: 'x' } } }), 'e')).rejects.toThrow('brings');
    expect((await broughtToMarket(db({ market_stock: { data: null, error: null } }), 'e')).size).toBe(0);
  });

  it('works out what’s left of every piece and option', async () => {
    const d = db({
      listings: {
        data: [
          { id: 'a', inventory_count: 10, listing_variants: [] },
          {
            id: 'b',
            inventory_count: null,
            listing_variants: [
              { id: 'v', option_combination: { Colour: 'Blue' }, price_cents: 900, inventory_count: 5, status: 'active' },
              { id: 'w', option_combination: { Colour: 'Red' }, price_cents: null, inventory_count: null, status: 'active' },
              { id: 'x', option_combination: { Colour: 'Old' }, price_cents: null, inventory_count: 1, status: 'archived' },
            ],
          },
        ],
        error: null,
      },
      market_stock: { data: [{ listing_id: 'a', listing_variant_id: null, brought: 3 }, { listing_id: 'b', listing_variant_id: 'v', brought: 2 }], error: null },
      orders: { data: [{ order_items: [{ listing_id: 'a', listing_variant_id: null, quantity: 1 }, { listing_id: 'b', listing_variant_id: 'v', quantity: 2 }] }], error: null },
    });
    const s = await marketPieceStock(d, 't', 'e', ['a', 'b']);
    expect(s.get('a')).toEqual({ left: 2, options: [] });
    expect(s.get('b')).toEqual({
      left: null,
      options: [
        { id: 'v', label: 'Blue', priceCents: 900, left: 0 },
        { id: 'w', label: 'Red', priceCents: null, left: null },
      ],
    });
    expect((await marketPieceStock(d, 't', 'e', [])).size).toBe(0);
    await expect(marketPieceStock(db({ listings: { data: null, error: { message: 'x' } } }), 't', 'e', ['a'])).rejects.toThrow('on hand');
    expect((await marketPieceStock(db({ listings: { data: null, error: null } }), 't', 'e', ['a'])).size).toBe(0);
  });

  it('keys a piece and an option apart', () => {
    expect(countKey('a', null)).toBe('a');
    expect(countKey('a', 'v')).toBe('a:v');
  });
});
