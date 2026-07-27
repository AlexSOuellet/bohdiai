import { describe, it, expect, vi, beforeEach } from 'vitest';

const from = vi.fn();
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({ from }) }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

import { readDraftTree, stageDraftTree, publishDraft, resetDraft } from './draft';

beforeEach(() => {
  from.mockReset();
});

/** A chainable query stub. Every builder method returns the chain; the chain is
 *  awaitable (resolves to `result`) and `.maybeSingle()` resolves to `result`. */
function query(result: unknown) {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'update', 'delete', 'upsert', 'insert']) {
    chain[m] = vi.fn(() => chain);
  }
  chain['maybeSingle'] = vi.fn(() => Promise.resolve(result));
  chain['then'] = (resolve: (v: unknown) => unknown) => resolve(result);
  return chain;
}

describe('readDraftTree', () => {
  it('returns the draft layout_tree when a draft exists', async () => {
    from.mockReturnValue(query({ data: { layout_tree: { root: { kind: 'archetype', lookKey: 'ember' } } }, error: null }));
    expect(await readDraftTree('t1')).toEqual({ root: { kind: 'archetype', lookKey: 'ember' } });
  });

  it('returns null when no draft exists', async () => {
    from.mockReturnValue(query({ data: null, error: null }));
    expect(await readDraftTree('t1')).toBeNull();
  });
});

describe('stageDraftTree', () => {
  it('upserts the tree keyed by tenant', async () => {
    const q = query({ error: null });
    from.mockReturnValue(q);
    const res = await stageDraftTree('t1', { root: { kind: 'archetype' } });
    expect(res.ok).toBe(true);
    expect(from).toHaveBeenCalledWith('store_drafts');
    expect(q['upsert']).toHaveBeenCalledWith(
      { tenant_id: 't1', layout_tree: { root: { kind: 'archetype' } }, updated_at: expect.any(String) },
      { onConflict: 'tenant_id' },
    );
  });
});

describe('resetDraft', () => {
  it('deletes the draft row for the tenant', async () => {
    const q = query({ error: null });
    from.mockReturnValue(q);
    const res = await resetDraft('t1');
    expect(res.ok).toBe(true);
    expect(from).toHaveBeenCalledWith('store_drafts');
    expect(q['delete']).toHaveBeenCalled();
  });
});

describe('publishDraft', () => {
  it('returns not-ok when there is no draft', async () => {
    from.mockReturnValue(query({ data: null, error: null })); // readDraftTree → null
    const res = await publishDraft('t1');
    expect(res.ok).toBe(false);
  });

  it('promotes the draft onto the live home page, syncs mood, and clears the draft', async () => {
    from
      .mockReturnValueOnce(query({ data: { layout_tree: { root: { kind: 'archetype', mood: 'rustic' } } }, error: null })) // readDraftTree
      .mockReturnValueOnce(query({ data: { id: 'p1' }, error: null })) // content_pages select id
      .mockReturnValueOnce(query({ error: null })) // content_pages update
      .mockReturnValueOnce(query({ error: null })) // tenants mood update
      .mockReturnValueOnce(query({ error: null })); // resetDraft delete
    const res = await publishDraft('t1');
    expect(res.ok).toBe(true);
    expect(from).toHaveBeenCalledTimes(5);
  });
});
