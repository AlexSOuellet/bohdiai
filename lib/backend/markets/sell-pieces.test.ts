import { describe, it, expect, vi } from 'vitest';

const state = vi.hoisted(() => ({
  products: [] as unknown[],
  counts: new Map<string, unknown>(),
  promos: [] as unknown[],
}));
vi.mock('@/lib/storefront/catalog', async (orig) => ({ ...(await orig<object>()), loadProductsByIds: async () => state.products }));
vi.mock('@/lib/storefront/promotions-load', () => ({ loadShopPromotions: async () => ({ promos: state.promos, today: '2026-10-20' }) }));
vi.mock('@/lib/market/stock', async (orig) => ({ ...(await orig<object>()), marketPieceStock: async () => state.counts }));

const { loadSellPieces } = await import('./sell-pieces');

const piece = (id: string, priceCents: number, status = 'active') => ({ view: { id, name: id === 'scarf' ? 'Scarf' : 'Mug', status }, priceCents, isPreview: false });

describe('loadSellPieces', () => {
  it('makes one line per piece, or per option of a piece, each with what’s left and its price', async () => {
    state.products = [piece('mug', 2000), piece('scarf', 3000), piece('gone', 1000, 'sold_out'), piece('free', 0)];
    state.counts = new Map([
      ['mug', { left: 4, options: [] }],
      ['scarf', { left: null, options: [{ id: 'v1', label: 'Blue', priceCents: 2800, left: 1 }, { id: 'v2', label: 'Red', priceCents: null, left: null }] }],
    ]);
    expect(await loadSellPieces({} as never, 't', 'e', ['mug', 'scarf', 'gone', 'free'])).toEqual([
      { id: 'mug', listingId: 'mug', variantId: null, name: 'Mug', priceCents: 2000, price: '$20', left: 4 },
      { id: 'scarf:v1', listingId: 'scarf', variantId: 'v1', name: 'Scarf, Blue', priceCents: 2800, price: '$28', left: 1 },
      { id: 'scarf:v2', listingId: 'scarf', variantId: 'v2', name: 'Scarf, Red', priceCents: 3000, price: '$30', left: null },
    ]);
  });
  it('takes the running sale off, and leaves out an option with no price', async () => {
    state.promos = [{ id: 's', kind: 'sale', name: 'Fall', code: null, percentOff: 50, amountOffCents: null, startsOn: null, endsOn: null, maxUses: null, uses: 0, active: true }];
    state.products = [piece('mug', 2000), piece('scarf', 0)];
    state.counts = new Map([['scarf', { left: null, options: [{ id: 'v1', label: 'Blue', priceCents: null, left: null }] }]]);
    expect(await loadSellPieces({} as never, 't', 'e', ['mug', 'scarf'])).toEqual([{ id: 'mug', listingId: 'mug', variantId: null, name: 'Mug', priceCents: 1000, price: '$10', left: null }]);
  });
});
