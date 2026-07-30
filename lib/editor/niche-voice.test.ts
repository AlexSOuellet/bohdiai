import { describe, it, expect, vi, beforeEach } from 'vitest';

const from = vi.fn();
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({ from }) }));

import { loadNicheVoice } from './niche-voice';

/** A chainable query stub whose `.single()` resolves to `result`. */
function query(result: unknown) {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'eq']) chain[m] = vi.fn(() => chain);
  chain['single'] = vi.fn(() => Promise.resolve(result));
  return chain;
}

beforeEach(() => from.mockReset());

describe('loadNicheVoice', () => {
  it("returns displayName + body from the tenant's niche row", async () => {
    from
      .mockReturnValueOnce(query({ data: { primary_niche: 'candles' }, error: null }))
      .mockReturnValueOnce(query({ data: { display_name: 'Candle maker', body_markdown: 'People buy candles for the feeling of a room.' }, error: null }));
    expect(await loadNicheVoice('t1')).toEqual({ displayName: 'Candle maker', body: 'People buy candles for the feeling of a room.' });
  });

  it('returns a safe empty body when the tenant has no niche', async () => {
    from.mockReturnValueOnce(query({ data: { primary_niche: null }, error: null }));
    const v = await loadNicheVoice('t1');
    expect(v.body).toBe('');
  });

  it('returns a safe empty body when the niche row is missing', async () => {
    from
      .mockReturnValueOnce(query({ data: { primary_niche: 'ghost' }, error: null }))
      .mockReturnValueOnce(query({ data: null, error: { message: 'no row' } }));
    const v = await loadNicheVoice('t1');
    expect(v.body).toBe('');
  });
});
