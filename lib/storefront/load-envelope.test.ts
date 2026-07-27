import { describe, it, expect, vi, beforeEach } from 'vitest';

const from = vi.fn();
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({ from }) }));

import { loadDraftEnvelope } from './load-envelope';

/** Chainable query stub whose `.maybeSingle()` resolves to `result`. */
function query(result: unknown) {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'eq']) chain[m] = vi.fn(() => chain);
  chain['maybeSingle'] = vi.fn(() => Promise.resolve(result));
  return chain;
}

beforeEach(() => from.mockReset());

describe('loadDraftEnvelope', () => {
  it('returns the archetype root of a draft', async () => {
    from.mockReturnValue(query({ data: { layout_tree: { root: { kind: 'archetype', lookKey: 'ember' } } } }));
    expect(await loadDraftEnvelope('t1')).toEqual({ kind: 'archetype', lookKey: 'ember' });
  });

  it('returns null when there is no draft', async () => {
    from.mockReturnValue(query({ data: null }));
    expect(await loadDraftEnvelope('t1')).toBeNull();
  });

  it('returns null when the draft root is not an archetype envelope', async () => {
    from.mockReturnValue(query({ data: { layout_tree: { root: { kind: 'legacy' } } } }));
    expect(await loadDraftEnvelope('t1')).toBeNull();
  });
});
