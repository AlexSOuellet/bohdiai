import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = {
  features: new Set<string>(['market_shop']),
  rpcErrors: [] as ({ code: string; message: string; hint?: string } | null)[],
  variant: { data: { price_cents: 900 } as { price_cents: number | null } | null, error: null as { message: string } | null },
  pieces: new Map<string, number>([
    ['a', 1800],
    ['b', 2200],
  ]),
};
const rpc = vi.fn(() => Promise.resolve({ error: state.rpcErrors.shift() ?? null }));
const revalidatePath = vi.fn();

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ site: { tenantId: 't1' } }) }));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => state.features }));
const variantQuery = { select: () => variantQuery, eq: () => variantQuery, maybeSingle: async () => state.variant };
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: async () => ({ rpc, from: () => variantQuery }) }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@/lib/storefront/catalog', () => ({
  loadProductsByIds: async (_db: unknown, _t: string, ids: string[]) =>
    ids.flatMap((id) => (state.pieces.has(id) ? [{ priceCents: state.pieces.get(id), view: { id, name: `Piece ${id}` } }] : [])),
}));
vi.mock('@/lib/storefront/promotions-load', () => ({ loadShopPromotions: async () => ({ promos: [], today: '2026-10-24' }) }));

const { recordMarketSale, recordMarketSales, settleMarketOrder } = await import('./today-actions');

beforeEach(() => {
  state.features = new Set(['market_shop']);
  state.rpcErrors = [];
  state.variant = { data: { price_cents: 900 }, error: null };
  rpc.mockClear();
});

describe('recording one sale', () => {
  it('records the piece at its price and refreshes Today', async () => {
    expect(await recordMarketSale('e1', 'a', 'venmo')).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith('market_record_sale', { p_tenant_id: 't1', p_event_id: 'e1', p_listing_id: 'a', p_method: 'venmo', p_price_cents: 1800, p_quantity: 1 });
    expect(revalidatePath).toHaveBeenCalledWith('/manage/markets/e1/today');
  });

  it('records several of one option, at the option’s own price or the piece’s', async () => {
    expect(await recordMarketSale('e1', 'a', 'cash', { variantId: 'v1', quantity: 2 })).toEqual({ ok: true });
    expect(rpc).toHaveBeenLastCalledWith('market_record_sale', expect.objectContaining({ p_variant_id: 'v1', p_price_cents: 900, p_quantity: 2 }));
    state.variant = { data: { price_cents: null }, error: null };
    await recordMarketSale('e1', 'a', 'cash', { variantId: 'v1' });
    expect(rpc).toHaveBeenLastCalledWith('market_record_sale', expect.objectContaining({ p_price_cents: 1800 }));
    state.variant = { data: null, error: null };
    expect(await recordMarketSale('e1', 'a', 'cash', { variantId: 'v9' })).toEqual({ ok: false, error: 'That option isn’t on your site any more.' });
    expect((await recordMarketSale('e1', 'a', 'cash', { quantity: 0 })).ok).toBe(false);
  });

  it('says what’s left at the market, or asks which option', async () => {
    state.rpcErrors = [{ code: 'P0023', message: '', hint: '1' }, { code: 'P0023', message: '', hint: '0' }, { code: 'P0024', message: '' }];
    expect(await recordMarketSale('e1', 'a', 'cash', { quantity: 2 })).toEqual({ ok: false, error: 'Only 1 of Piece a left at this market.' });
    expect(await recordMarketSale('e1', 'a', 'cash')).toEqual({ ok: false, error: 'Piece a is all gone at this market.' });
    expect(await recordMarketSale('e1', 'a', 'cash')).toEqual({ ok: false, error: 'Pick which Piece a they’re taking.' });
  });

  it('refuses when the market shop is off, the method is unknown, or the piece is gone', async () => {
    expect((await recordMarketSale('e1', 'a', 'bitcoin')).ok).toBe(false);
    expect((await recordMarketSale('e1', 'zz', 'cash')).ok).toBe(false);
    state.features = new Set();
    expect((await recordMarketSale('e1', 'a', 'cash')).ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('turns database refusals into plain words', async () => {
    state.rpcErrors = [{ code: 'P0040', message: '' }, { code: 'P0021', message: '' }, { code: 'XX', message: 'boom' }];
    expect(await recordMarketSale('e1', 'a', 'cash')).toEqual({ ok: false, error: 'This market isn’t on today, so it can’t take a sale.' });
    expect(await recordMarketSale('e1', 'a', 'cash')).toEqual({ ok: false, error: 'That one is already sold or held, or isn’t marked for this market.' });
    expect(await recordMarketSale('e1', 'a', 'cash')).toEqual({ ok: false, error: 'The sale couldn’t be recorded. Try again in a moment.' });
  });
});

const line = (id: string, quantity = 1) => ({ id, listingId: id, variantId: null, quantity });

describe('selling several at the table', () => {
  it('records every piece, paid the same way', async () => {
    expect(await recordMarketSales('e1', [line('a'), line('b', 3)], 'cashapp')).toEqual({ ok: true, count: 4 });
    expect(rpc).toHaveBeenCalledTimes(2);
  });

  it('stops at the first that fails and says how many went through', async () => {
    state.rpcErrors = [null, { code: 'P0021', message: '' }];
    const r = await recordMarketSales('e1', [line('a'), line('b')], 'cash');
    expect(r).toEqual({ ok: false, error: 'That one is already sold or held, or isn’t marked for this market. 1 of 2 were recorded; the rest are still in the sale.', recorded: ['a'] });
  });

  it('asks for pieces first', async () => {
    expect(await recordMarketSales('e1', [], 'cash')).toEqual({ ok: false, error: 'Tap the pieces they’re taking first.', recorded: [] });
  });
});

describe('settling a buyer’s hold', () => {
  it('marks it paid or not received, on the market shop alone (no online orders needed)', async () => {
    expect(await settleMarketOrder('e1', 'o1', 'paid')).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith('set_order_status', { p_tenant_id: 't1', p_order_id: 'o1', p_status: 'paid' });
    expect(await settleMarketOrder('e1', 'o1', 'canceled')).toEqual({ ok: true });
    expect(revalidatePath).toHaveBeenCalledWith('/manage/markets/e1/day');
  });

  it('refuses when the market shop is off or the step is unknown, and says when it fails', async () => {
    state.features = new Set();
    expect(await settleMarketOrder('e1', 'o1', 'paid')).toMatchObject({ ok: false });
    state.features = new Set(['market_shop']);
    expect(await settleMarketOrder('e1', 'o1', 'fulfilled' as 'paid')).toMatchObject({ ok: false });
    state.rpcErrors = [{ code: 'XX000', message: 'x' }];
    expect(await settleMarketOrder('e1', 'o1', 'paid')).toEqual({ ok: false, error: 'That order couldn’t be updated. Try again in a moment.' });
  });
});
