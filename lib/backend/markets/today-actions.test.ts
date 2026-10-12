import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = {
  features: new Set<string>(['market_shop']),
  rpcErrors: [] as ({ code: string; message: string } | null)[],
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
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: async () => ({ rpc }) }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@/lib/storefront/catalog', () => ({
  loadProductsByIds: async (_db: unknown, _t: string, ids: string[]) =>
    ids.flatMap((id) => (state.pieces.has(id) ? [{ priceCents: state.pieces.get(id), view: { id } }] : [])),
}));
vi.mock('@/lib/storefront/promotions-load', () => ({ loadShopPromotions: async () => ({ promos: [], today: '2026-10-24' }) }));

const { recordMarketSale, recordMarketSales } = await import('./today-actions');

beforeEach(() => {
  state.features = new Set(['market_shop']);
  state.rpcErrors = [];
  rpc.mockClear();
});

describe('recording one sale', () => {
  it('records the piece at its price and refreshes Today', async () => {
    expect(await recordMarketSale('e1', 'a', 'venmo')).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith('market_record_sale', { p_tenant_id: 't1', p_event_id: 'e1', p_listing_id: 'a', p_method: 'venmo', p_price_cents: 1800 });
    expect(revalidatePath).toHaveBeenCalledWith('/manage/markets/e1/today');
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

describe('selling several at the table', () => {
  it('records every piece, paid the same way', async () => {
    expect(await recordMarketSales('e1', ['a', 'b'], 'cashapp')).toEqual({ ok: true, count: 2 });
    expect(rpc).toHaveBeenCalledTimes(2);
  });

  it('stops at the first that fails and says how many went through', async () => {
    state.rpcErrors = [null, { code: 'P0021', message: '' }];
    const r = await recordMarketSales('e1', ['a', 'b'], 'cash');
    expect(r).toEqual({ ok: false, error: 'That one is already sold or held, or isn’t marked for this market. 1 of 2 were recorded; the rest are still in the sale.', recorded: ['a'] });
  });

  it('asks for pieces first', async () => {
    expect(await recordMarketSales('e1', [], 'cash')).toEqual({ ok: false, error: 'Tap the pieces they’re taking first.', recorded: [] });
  });
});
