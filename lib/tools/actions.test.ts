import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({
  features: new Set<string>(['catalog']),
  product: { data: { id: 'l1' }, error: null } as { data: unknown; error: unknown },
  save: { ok: true } as unknown,
  throws: null as unknown,
}));
const revalidatePath = vi.hoisted(() => vi.fn());
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));
vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1' } }) }));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => state.features }));
vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: async () => ({ from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ is: () => ({ maybeSingle: async () => state.product }) }) }) }) }) }),
}));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/logger', () => ({ logger }));
vi.mock('./product-costs', () => ({
  saveProductCosts: async () => {
    if (state.throws !== null) throw state.throws;
    return state.save;
  },
}));

const { saveCostsToProduct } = await import('./actions');
const costs = { yield: '12', hours: '', rate: '', extras: '', markup: 2.5 as const, batch: [], piece: [] };

beforeEach(() => {
  state.features = new Set(['catalog']);
  state.product = { data: { id: 'l1' }, error: null };
  state.save = { ok: true };
  state.throws = null;
  revalidatePath.mockReset();
  logger.error.mockReset();
});

describe('saveCostsToProduct', () => {
  it('saves the tool’s numbers onto her product', async () => {
    expect(await saveCostsToProduct('l1', costs)).toEqual({ ok: true });
    expect(revalidatePath).toHaveBeenCalledWith('/manage/products/l1');
  });

  it('says why it can’t', async () => {
    state.features = new Set();
    expect(await saveCostsToProduct('l1', costs)).toEqual({ ok: false, error: 'Products aren’t switched on for this site.' });
    state.features = new Set(['gallery_pieces']);
    state.product = { data: null, error: null };
    expect(await saveCostsToProduct('l1', costs)).toEqual({ ok: false, error: 'That product isn’t on your site any more.' });
    state.product = { data: null, error: { message: 'down' } };
    expect(await saveCostsToProduct('l1', costs)).toEqual({ ok: false, error: 'The costs couldn’t be saved. Try again in a moment.' });
    expect(logger.error).toHaveBeenCalledWith('tools: product lookup failed', { tenantId: 't1', error: 'down' });
  });

  it('passes on a check that fails, and says so when the save fails', async () => {
    state.save = { ok: false, error: 'Check the hours to make the batch.' };
    expect(await saveCostsToProduct('l1', costs)).toEqual({ ok: false, error: 'Check the hours to make the batch.' });
    state.throws = new Error('down');
    expect(await saveCostsToProduct('l1', costs)).toEqual({ ok: false, error: 'The costs couldn’t be saved. Try again in a moment.' });
    state.throws = 'odd';
    expect(await saveCostsToProduct('l1', costs)).toEqual({ ok: false, error: 'The costs couldn’t be saved. Try again in a moment.' });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
