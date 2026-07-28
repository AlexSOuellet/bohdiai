import { describe, it, expect, vi, beforeEach } from 'vitest';

const getCurrentShop = vi.fn();
const readDraftTree = vi.fn();
const stageDraftTree = vi.fn();
const publishDraft = vi.fn();
const resetDraft = vi.fn();
const loadHomeEnvelope = vi.fn();

vi.mock('@/lib/dashboard/current-shop', () => ({ getCurrentShop: () => getCurrentShop() }));
vi.mock('@/lib/editor/draft', () => ({
  readDraftTree: (id: string) => readDraftTree(id),
  stageDraftTree: (id: string, t: unknown) => stageDraftTree(id, t),
  publishDraft: (id: string) => publishDraft(id),
  resetDraft: (id: string) => resetDraft(id),
}));
vi.mock('@/lib/storefront/load-envelope', () => ({ loadHomeEnvelope: (id: string) => loadHomeEnvelope(id) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { stageLook, publishStore, resetStore } from './actions';

beforeEach(() => {
  [getCurrentShop, readDraftTree, stageDraftTree, publishDraft, resetDraft, loadHomeEnvelope].forEach((m) => m.mockReset());
});

describe('stageLook', () => {
  it('stages the look onto the draft, seeding from live when no draft exists', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    readDraftTree.mockResolvedValue(null);
    loadHomeEnvelope.mockResolvedValue({ kind: 'archetype', lookKey: 'old', mood: 'cozy' });
    stageDraftTree.mockResolvedValue({ ok: true });
    const res = await stageLook('main-street-ember', 'rustic', { mode: 'default', opacity: null });
    expect(res.ok).toBe(true);
    expect(stageDraftTree).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ root: expect.objectContaining({ lookKey: 'main-street-ember', mood: 'rustic' }) }),
    );
  });

  it('builds on the existing draft when one is present, not the live envelope', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    readDraftTree.mockResolvedValue({ root: { kind: 'archetype', lookKey: 'staged', mood: 'cozy' } });
    stageDraftTree.mockResolvedValue({ ok: true });
    const res = await stageLook('main-street-ember', 'rustic');
    expect(res.ok).toBe(true);
    expect(loadHomeEnvelope).not.toHaveBeenCalled();
    expect(stageDraftTree).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ root: expect.objectContaining({ lookKey: 'main-street-ember', mood: 'rustic' }) }),
    );
  });

  it('rejects an unknown skin without touching the draft', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    const res = await stageLook('not-a-skin', 'rustic', { mode: 'default', opacity: null });
    expect(res.ok).toBe(false);
    expect(stageDraftTree).not.toHaveBeenCalled();
  });

  it('rejects an unknown feeling without touching the draft', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    const res = await stageLook('main-street-ember', 'not-a-feeling');
    expect(res.ok).toBe(false);
    expect(stageDraftTree).not.toHaveBeenCalled();
  });

  it('fails cleanly when there is no store', async () => {
    getCurrentShop.mockResolvedValue(null);
    const res = await stageLook('main-street-ember', 'rustic');
    expect(res.ok).toBe(false);
    expect(stageDraftTree).not.toHaveBeenCalled();
  });

  it('fails when a legacy store has no loadable envelope', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    readDraftTree.mockResolvedValue(null);
    loadHomeEnvelope.mockResolvedValue(null);
    const res = await stageLook('main-street-ember', 'rustic');
    expect(res.ok).toBe(false);
    expect(stageDraftTree).not.toHaveBeenCalled();
  });

  it('surfaces a staging write failure', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    readDraftTree.mockResolvedValue(null);
    loadHomeEnvelope.mockResolvedValue({ kind: 'archetype', lookKey: 'old', mood: 'cozy' });
    stageDraftTree.mockResolvedValue({ ok: false });
    const res = await stageLook('main-street-ember', 'rustic');
    expect(res.ok).toBe(false);
  });
});

describe('publishStore / resetStore', () => {
  it('publishStore delegates to publishDraft for the current shop', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    publishDraft.mockResolvedValue({ ok: true });
    expect((await publishStore()).ok).toBe(true);
    expect(publishDraft).toHaveBeenCalledWith('t1');
  });

  it('publishStore reports failure when there is nothing to publish', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    publishDraft.mockResolvedValue({ ok: false });
    expect((await publishStore()).ok).toBe(false);
  });

  it('resetStore delegates to resetDraft for the current shop', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    resetDraft.mockResolvedValue({ ok: true });
    expect((await resetStore()).ok).toBe(true);
    expect(resetDraft).toHaveBeenCalledWith('t1');
  });

  it('publishStore / resetStore fail cleanly with no store', async () => {
    getCurrentShop.mockResolvedValue(null);
    expect((await publishStore()).ok).toBe(false);
    expect((await resetStore()).ok).toBe(false);
    expect(publishDraft).not.toHaveBeenCalled();
    expect(resetDraft).not.toHaveBeenCalled();
  });
});
