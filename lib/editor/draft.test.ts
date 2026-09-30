import { describe, it, expect, vi, beforeEach } from 'vitest';

const from = vi.fn();
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({ from }) }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

import { readDraftTree, stageDraftTree, publishDraft, resetDraft } from './draft';
import { logger } from '@/lib/logger';

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

describe('readDraftTree — shape guard', () => {
  it('returns null when the stored layout_tree is not an object (array, scalar, missing)', async () => {
    for (const layout_tree of [[{ root: {} }], 'tree', 7, undefined, null]) {
      from.mockReturnValueOnce(query({ data: { layout_tree }, error: null }));
      expect(await readDraftTree('t1')).toBeNull();
    }
  });
});

describe('stageDraftTree / resetDraft — write failures', () => {
  it('stage reports not-ok and logs when the upsert fails', async () => {
    from.mockReturnValue(query({ error: { message: 'rls denied' } }));
    const res = await stageDraftTree('t1', { root: {} });
    expect(res.ok).toBe(false);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith('draft: stage failed', { tenantId: 't1', err: 'rls denied' });
  });

  it('reset reports not-ok and logs when the delete fails', async () => {
    from.mockReturnValue(query({ error: { message: 'gone' } }));
    const res = await resetDraft('t1');
    expect(res.ok).toBe(false);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith('draft: reset failed', { tenantId: 't1', err: 'gone' });
  });
});

describe('publishDraft — failure paths and mood sync', () => {
  const draft = (root: unknown) => query({ data: { layout_tree: { root } }, error: null });

  it('refuses to publish when the live home page cannot be found', async () => {
    from.mockReturnValueOnce(draft({ mood: 'rustic' })).mockReturnValueOnce(query({ data: null, error: null }));
    expect((await publishDraft('t1')).ok).toBe(false);
    expect(from).toHaveBeenCalledTimes(2); // no update, no reset — the draft survives
  });

  it('refuses to publish when the home page lookup errors', async () => {
    from
      .mockReturnValueOnce(draft({ mood: 'rustic' }))
      .mockReturnValueOnce(query({ data: { id: 'p1' }, error: { message: 'boom' } }));
    expect((await publishDraft('t1')).ok).toBe(false);
    expect(from).toHaveBeenCalledTimes(2);
  });

  it('keeps the draft when the live page write fails', async () => {
    from
      .mockReturnValueOnce(draft({ mood: 'rustic' }))
      .mockReturnValueOnce(query({ data: { id: 'p1' }, error: null }))
      .mockReturnValueOnce(query({ error: { message: 'write denied' } }));
    expect((await publishDraft('t1')).ok).toBe(false);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith('draft: publish write failed', { tenantId: 't1', err: 'write denied' });
    expect(from).toHaveBeenCalledTimes(3); // never reached tenants or the reset
  });

  it('still publishes (and warns) when only the mood sync fails', async () => {
    from
      .mockReturnValueOnce(draft({ mood: 'cozy' }))
      .mockReturnValueOnce(query({ data: { id: 'p1' }, error: null }))
      .mockReturnValueOnce(query({ error: null }))
      .mockReturnValueOnce(query({ error: { message: 'tenant locked' } }))
      .mockReturnValueOnce(query({ error: null }));
    expect((await publishDraft('t1')).ok).toBe(true);
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith('draft: publish mood sync failed', { tenantId: 't1', err: 'tenant locked' });
    expect(from).toHaveBeenCalledTimes(5);
  });

  it('skips the mood sync when the envelope carries no string mood (or no usable root)', async () => {
    for (const root of [{ kind: 'archetype' }, { mood: 7 }, ['not', 'a', 'record'], null]) {
      from.mockReset();
      from
        .mockReturnValueOnce(draft(root))
        .mockReturnValueOnce(query({ data: { id: 'p1' }, error: null }))
        .mockReturnValueOnce(query({ error: null }))
        .mockReturnValueOnce(query({ error: null }));
      expect((await publishDraft('t1')).ok).toBe(true);
      expect(from.mock.calls.map((c) => c[0])).toEqual(['store_drafts', 'content_pages', 'content_pages', 'store_drafts']);
    }
  });
});
