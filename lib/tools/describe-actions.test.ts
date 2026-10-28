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

import { describePiece } from './describe-actions';

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
