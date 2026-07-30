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

const runContentEdit = vi.fn();
const loadNicheVoice = vi.fn();
vi.mock('@/lib/editor/content-agent', () => ({
  runContentEdit: (a: unknown) => runContentEdit(a),
  ContentEditError: class ContentEditError extends Error {},
}));
vi.mock('@/lib/editor/niche-voice', () => ({ loadNicheVoice: (id: string) => loadNicheVoice(id) }));

import { stageLook, publishStore, resetStore, editContent } from './actions';

beforeEach(() => {
  [getCurrentShop, readDraftTree, stageDraftTree, publishDraft, resetDraft, loadHomeEnvelope, runContentEdit, loadNicheVoice].forEach((m) => m.mockReset());
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

describe('editContent', () => {
  const liveEnv = { kind: 'archetype', content: { goods: { title: 'Old goods' }, moment: { eyebrow: 'x' } } };

  it("stages Bohdi's rewrites at the right envelope paths and marks the section made-yours, never touching live", async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    readDraftTree.mockResolvedValue(null);
    loadHomeEnvelope.mockResolvedValue(structuredClone(liveEnv));
    loadNicheVoice.mockResolvedValue({ displayName: 'Candle maker', body: 'niche' });
    runContentEdit.mockResolvedValue({ values: { 'goods.title': 'The candles' } });
    stageDraftTree.mockResolvedValue({ ok: true });

    const res = await editContent(['goods.title'], 'warm it up', 'goods');
    expect(res.ok).toBe(true);
    const staged = stageDraftTree.mock.calls[0]![1] as { root: { content: { goods: { title: string }; madeYours?: string[] } } };
    expect(staged.root.content.goods.title).toBe('The candles');
    expect(staged.root.content.madeYours).toContain('goods');
    // Bohdi saw the current value + niche voice.
    expect(runContentEdit).toHaveBeenCalledWith(
      expect.objectContaining({ current: { 'goods.title': 'Old goods' }, instruction: 'warm it up', niche: { displayName: 'Candle maker', body: 'niche' } }),
    );
  });

  it('returns a friendly error and does NOT stage when Bohdi throws', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    readDraftTree.mockResolvedValue(null);
    loadHomeEnvelope.mockResolvedValue(structuredClone(liveEnv));
    loadNicheVoice.mockResolvedValue({ displayName: 'x', body: '' });
    runContentEdit.mockRejectedValue(new Error('boom'));

    const res = await editContent(['goods.title'], 'warm it up', 'goods');
    expect(res.ok).toBe(false);
    expect(stageDraftTree).not.toHaveBeenCalled();
  });

  it('reports cleanly (and does not stage) when Bohdi changes nothing', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    readDraftTree.mockResolvedValue(null);
    loadHomeEnvelope.mockResolvedValue(structuredClone(liveEnv));
    loadNicheVoice.mockResolvedValue({ displayName: 'x', body: '' });
    runContentEdit.mockResolvedValue({ values: {} });

    const res = await editContent(['goods.title'], 'make it cozier', 'goods');
    expect(res.ok).toBe(false);
    expect(stageDraftTree).not.toHaveBeenCalled();
  });

  it('rejects unknown field ids without calling Bohdi', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    const res = await editContent(['not.a.field'], 'x');
    expect(res.ok).toBe(false);
    expect(runContentEdit).not.toHaveBeenCalled();
  });

  it('fails cleanly with no store', async () => {
    getCurrentShop.mockResolvedValue(null);
    const res = await editContent(['goods.title'], 'x', 'goods');
    expect(res.ok).toBe(false);
    expect(runContentEdit).not.toHaveBeenCalled();
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
