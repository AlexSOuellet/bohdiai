import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({
  free: false,
  used: 0,
  countError: null as unknown,
  photo: { data: { public_url: 'https://img/p.jpg' } as unknown, error: null as unknown },
  inserted: [] as unknown[],
  write: vi.fn(),
}));
const logger = vi.hoisted(() => ({ error: vi.fn() }));
const own = vi.hoisted(() => ({ product: null as unknown, costs: null as unknown, update: { data: [{ id: 'l1' }] as unknown, error: null as unknown }, sent: [] as unknown[] }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/backend/catalog/queries', () => ({ getProduct: async () => { if (own.product instanceof Error) throw own.product; return own.product; } }));
vi.mock('./product-costs', () => ({ loadProductCosts: async () => own.costs }));
vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: async () => ({
    from: () => ({ update: (row: unknown) => { own.sent.push(row); return { eq: () => ({ eq: () => ({ is: () => ({ select: async () => own.update }) }) }) }; } }),
  }),
}));

vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ site: { tenantId: 't1' } }) }));
vi.mock('@/lib/backend/plan/free', () => ({ isFreeSite: async () => state.free }));
vi.mock('@/lib/anthropic', () => ({ anthropicClient: () => ({}) }));
vi.mock('@/lib/logger', () => ({ logger }));
vi.mock('./describe', async (orig) => ({ ...(await orig<object>()), writeDescription: state.write }));
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'description_runs')
        return {
          select: () => ({ eq: () => ({ gte: async () => ({ count: state.used, error: state.countError }) }) }),
          insert: async (row: unknown) => {
            state.inserted.push(row);
            return { error: null };
          },
        };
      return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => state.photo }) }) }) };
    },
  }),
}));

import { describePiece, loadPieceForDescribe, saveDescriptionsToProduct } from './describe-actions';

const ask = { name: 'Lazy Susan', materials: ['Pine'], facts: '', price: '130', photoUploadId: '11111111-1111-4111-8111-111111111111' };

beforeEach(() => {
  state.free = false;
  state.used = 0;
  state.countError = null;
  state.photo = { data: { public_url: 'https://img/p.jpg' }, error: null };
  state.inserted = [];
  state.write.mockReset();
  state.write.mockResolvedValue({ ok: true, text: { short: 'S', description: 'D' } });
});

describe('describePiece', () => {
  it('writes it with the site’s own photo and price, counts the run, and says how many are left', async () => {
    expect(await describePiece(ask)).toEqual({ ok: true, text: { short: 'S', description: 'D' }, left: 99 });
    expect(state.write.mock.calls[0]![1]).toEqual({ name: 'Lazy Susan', materials: ['Pine'], facts: '', priceCents: 13000, photoUrl: 'https://img/p.jpg' });
    expect(state.inserted).toEqual([{ tenant_id: 't1' }]);
  });

  it('gives Free 30 a month and the paid plans 100, then says when more come', async () => {
    state.free = true;
    state.used = 29;
    expect(await describePiece(ask)).toMatchObject({ ok: true, left: 0 });
    state.used = 30;
    expect(await describePiece(ask)).toEqual({ ok: false, error: expect.stringMatching(/^You’ve used this month’s 30 descriptions\. More on /) });
    state.free = false;
    state.used = 100;
    expect((await describePiece(ask)).ok).toBe(false);
  });

  it('doesn’t count a run that didn’t write anything', async () => {
    state.write.mockResolvedValue({ ok: false, error: 'Give the piece a name first.' });
    expect(await describePiece(ask)).toEqual({ ok: false, error: 'Give the piece a name first.' });
    expect(state.inserted).toEqual([]);
  });

  it('turns down an odd request, a blank name and too many facts before anything runs', async () => {
    expect((await describePiece({ ...ask, photoUploadId: 'not-an-id' })).ok).toBe(false);
    expect((await describePiece({ ...ask, materials: [3] } as never)).ok).toBe(false);
    expect((await describePiece(null as never)).ok).toBe(false);
    expect(await describePiece({ ...ask, name: ' ' })).toEqual({ ok: false, error: 'Give the piece a name first.' });
    expect((await describePiece({ ...ask, facts: 'x'.repeat(501) })).ok).toBe(false);
    expect(state.write).not.toHaveBeenCalled();
  });

  it('runs without a photo, or with one that isn’t the site’s, and with no price', async () => {
    await describePiece({ ...ask, photoUploadId: null, price: '' });
    expect(state.write.mock.calls[0]![1]).toMatchObject({ photoUrl: null, priceCents: null });
    state.photo = { data: null, error: null };
    await describePiece(ask);
    expect(state.write.mock.calls[1]![1]).toMatchObject({ photoUrl: null });
    await describePiece({ ...ask, price: 'lots' });
    expect(state.write.mock.calls[2]![1]).toMatchObject({ priceCents: null });
  });

  it('says it couldn’t be written when the count, the photo or the writer fails', async () => {
    state.countError = { message: 'down' };
    expect((await describePiece(ask)).ok).toBe(false);
    state.countError = null;
    state.photo = { data: null, error: { message: 'gone' } };
    expect((await describePiece(ask)).ok).toBe(false);
    state.photo = { data: { public_url: 'https://img/p.jpg' }, error: null };
    state.write.mockRejectedValue('offline');
    expect(await describePiece(ask)).toEqual({ ok: false, error: 'The description couldn’t be written just now. Try again in a moment.' });
    expect(logger.error).toHaveBeenCalledWith('describe: failed', { tenantId: 't1', error: 'offline' });
  });
});

const L1 = '22222222-2222-4222-8222-222222222222';

describe('Describe it with one of her products (Alex, 2026-10-28)', () => {
  it('loads its name, price, main photo and what it’s made of', async () => {
    own.product = { name: 'Lazy Susan', price: '130', photos: [{ uploadId: 'p1', url: 'https://img/p.jpg' }] };
    own.costs = { batch: [{ name: '18" Round' }, { name: ' ' }], piece: [{ name: 'Print' }] };
    expect(await loadPieceForDescribe(L1)).toEqual({ ok: true, piece: { id: L1, name: 'Lazy Susan', price: '130', materials: ['18" Round', 'Print'], photo: { uploadId: 'p1', url: 'https://img/p.jpg' } } });
    own.product = { name: 'Tin', price: '', photos: [] };
    own.costs = null;
    expect(await loadPieceForDescribe(L1)).toMatchObject({ ok: true, piece: { materials: [], photo: null } });
  });

  it('says when the product is gone, the id is odd, or the load fails', async () => {
    expect((await loadPieceForDescribe('nope')).ok).toBe(false);
    own.product = null;
    expect(await loadPieceForDescribe(L1)).toEqual({ ok: false, error: 'That product isn’t on your site any more. Reload the page.' });
    own.product = new Error('down');
    expect((await loadPieceForDescribe(L1)).ok).toBe(false);
  });

  it('saves both descriptions onto it, trimmed, and nothing else', async () => {
    own.sent = [];
    own.update = { data: [{ id: L1 }], error: null };
    expect(await saveDescriptionsToProduct(L1, { short: ' S ', description: '' })).toEqual({ ok: true });
    expect(own.sent).toEqual([{ short_description: 'S', description: null }]);
  });

  it('says when it couldn’t save, the product is gone, or the request is odd', async () => {
    own.update = { data: null, error: { message: 'down' } };
    expect((await saveDescriptionsToProduct(L1, { short: 'S', description: 'D' })).ok).toBe(false);
    own.update = { data: [], error: null };
    expect(await saveDescriptionsToProduct(L1, { short: 'S', description: 'D' })).toEqual({ ok: false, error: 'That product isn’t on your site any more. Reload the page.' });
    expect((await saveDescriptionsToProduct('x', { short: 'S', description: 'D' })).ok).toBe(false);
    expect((await saveDescriptionsToProduct(L1, null as never)).ok).toBe(false);
  });
});
