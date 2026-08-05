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

// Listings plumbing — the walk product actions delegate DB work to these helpers and
// the storage upload to supabaseAdmin; mock them so the actions are tested in isolation.
const hasRealProducts = vi.fn();
const hasPlaceholderProducts = vi.fn();
const clearPlaceholderProducts = vi.fn();
const insertRealProduct = vi.fn();
const updateRealProduct = vi.fn();
const softDeleteProduct = vi.fn();
vi.mock('@/lib/listings/product-queries', () => ({
  hasRealProducts: (...a: unknown[]) => hasRealProducts(...a),
  hasPlaceholderProducts: (...a: unknown[]) => hasPlaceholderProducts(...a),
  clearPlaceholderProducts: (...a: unknown[]) => clearPlaceholderProducts(...a),
  insertRealProduct: (...a: unknown[]) => insertRealProduct(...a),
  updateRealProduct: (...a: unknown[]) => updateRealProduct(...a),
  softDeleteProduct: (...a: unknown[]) => softDeleteProduct(...a),
}));

const draftProductCopy = vi.fn();
vi.mock('@/lib/listings/product-copy', () => ({ draftProductCopy: (...a: unknown[]) => draftProductCopy(...a) }));

const requireUser = vi.fn();
vi.mock('@/lib/auth/session', () => ({ requireUser: () => requireUser() }));

const storageUpload = vi.fn();
const storageGetPublicUrl = vi.fn();
const uploadsInsert = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    storage: { from: () => ({ upload: storageUpload, getPublicUrl: storageGetPublicUrl }) },
    from: (table: string) => (table === 'uploads' ? { insert: uploadsInsert } : {}),
  }),
}));

import {
  stageLook,
  publishStore,
  resetStore,
  editContent,
  setFieldValues,
  setMomentPlayMode,
  setReviewQuotes,
  setFindUsRows,
  saveWalkProduct,
  updateWalkProduct,
  removeWalkProduct,
  uploadProductPhoto,
  draftProductCopyAction,
} from './actions';

beforeEach(() => {
  [getCurrentShop, readDraftTree, stageDraftTree, publishDraft, resetDraft, loadHomeEnvelope, runContentEdit, loadNicheVoice].forEach((m) => m.mockReset());
  [hasRealProducts, hasPlaceholderProducts, clearPlaceholderProducts, insertRealProduct, updateRealProduct, softDeleteProduct, draftProductCopy, requireUser, storageUpload, storageGetPublicUrl, uploadsInsert].forEach((m) => m.mockReset());
  // Safe defaults so unrelated tests (e.g. publishStore) don't trip on the new checks.
  hasRealProducts.mockResolvedValue(false);
  hasPlaceholderProducts.mockResolvedValue(false);
  clearPlaceholderProducts.mockResolvedValue(undefined);
  requireUser.mockResolvedValue({ id: 'u1' });
  storageUpload.mockResolvedValue({ error: null });
  storageGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://x/p.jpg' } });
  uploadsInsert.mockReturnValue({ select: () => ({ single: () => Promise.resolve({ data: { id: 'up1' }, error: null }) }) });
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

describe('setFieldValues (verbatim direct edit)', () => {
  const liveEnv = { kind: 'archetype', content: { goods: { title: 'Old goods' }, moment: { story: ['a'] } } };

  it('stages the maker\'s own words verbatim (trim only, keeps punctuation) and marks the section', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    readDraftTree.mockResolvedValue(null);
    loadHomeEnvelope.mockResolvedValue(structuredClone(liveEnv));
    stageDraftTree.mockResolvedValue({ ok: true });

    const res = await setFieldValues([{ id: 'goods.title', value: '  Fresh. Daily.  ' }], 'goods');
    expect(res.ok).toBe(true);
    const staged = stageDraftTree.mock.calls[0]![1] as { root: { content: { goods: { title: string }; madeYours?: string[] } } };
    expect(staged.root.content.goods.title).toBe('Fresh. Daily.'); // trimmed, period KEPT
    expect(staged.root.content.madeYours).toContain('goods');
    expect(runContentEdit).not.toHaveBeenCalled(); // Bohbi is not involved
  });

  it('skips unknown ids and reports nothing to save when all are unknown', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    const res = await setFieldValues([{ id: 'not.a.field', value: 'x' }]);
    expect(res.ok).toBe(false);
    expect(stageDraftTree).not.toHaveBeenCalled();
  });

  it('fails cleanly with no store', async () => {
    getCurrentShop.mockResolvedValue(null);
    const res = await setFieldValues([{ id: 'goods.title', value: 'x' }], 'goods');
    expect(res.ok).toBe(false);
    expect(stageDraftTree).not.toHaveBeenCalled();
  });
});

describe('setMomentPlayMode', () => {
  it('stages the play mode onto the draft moment and marks the hero made-yours', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    readDraftTree.mockResolvedValue(null);
    loadHomeEnvelope.mockResolvedValue({ kind: 'archetype', content: { moment: { story: ['a'] } } });
    stageDraftTree.mockResolvedValue({ ok: true });

    const res = await setMomentPlayMode('always');
    expect(res.ok).toBe(true);
    const staged = stageDraftTree.mock.calls[0]![1] as {
      root: { content: { moment: { playMode: string; story: string[] }; madeYours?: string[] } };
    };
    expect(staged.root.content.moment.playMode).toBe('always');
    expect(staged.root.content.moment.story).toEqual(['a']); // leaves the lines alone
    expect(staged.root.content.madeYours).toContain('hero');
  });

  it('rejects an unknown mode without touching the draft', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    const res = await setMomentPlayMode('weekly' as never);
    expect(res.ok).toBe(false);
    expect(stageDraftTree).not.toHaveBeenCalled();
  });

  it('fails cleanly with no store', async () => {
    getCurrentShop.mockResolvedValue(null);
    const res = await setMomentPlayMode('off');
    expect(res.ok).toBe(false);
    expect(stageDraftTree).not.toHaveBeenCalled();
  });
});

describe('setReviewQuotes (real testimonials)', () => {
  const liveEnv = { kind: 'archetype', content: { reviews: { title: 'Old kind words', items: [{ quote: 'seed', author: 'x' }] } } };

  it('stages the maker’s real quotes, preserves the heading, marks reviews made-yours, and un-hides it', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    readDraftTree.mockResolvedValue({ root: { content: { reviews: { title: 'Old kind words' }, hiddenSections: ['reviews'] } } });
    stageDraftTree.mockResolvedValue({ ok: true });

    const res = await setReviewQuotes([
      { quote: 'Best candle I have bought', author: 'Dana R.', location: 'RI' },
      { quote: '', author: '' }, // blank row dropped
    ]);
    expect(res.ok).toBe(true);
    const staged = stageDraftTree.mock.calls[0]![1] as {
      root: { content: { reviews: { title: string; items: unknown[] }; madeYours?: string[]; hiddenSections?: string[] } };
    };
    expect(staged.root.content.reviews.items).toEqual([{ quote: 'Best candle I have bought', author: 'Dana R.', location: 'RI' }]);
    expect(staged.root.content.reviews.title).toBe('Old kind words'); // heading preserved
    expect(staged.root.content.madeYours).toContain('reviews');
    expect(staged.root.content.hiddenSections).not.toContain('reviews'); // real content brings it back on
  });

  it('drops a blank location so an empty optional never lands', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    readDraftTree.mockResolvedValue(null);
    loadHomeEnvelope.mockResolvedValue(structuredClone(liveEnv));
    stageDraftTree.mockResolvedValue({ ok: true });
    await setReviewQuotes([{ quote: 'Lovely', author: 'Sam', location: '  ' }]);
    const staged = stageDraftTree.mock.calls[0]![1] as { root: { content: { reviews: { items: Record<string, unknown>[] } } } };
    expect(staged.root.content.reviews.items[0]).toEqual({ quote: 'Lovely', author: 'Sam' });
  });

  it('saves a COMPLETE real rating alongside the quotes', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    readDraftTree.mockResolvedValue(null);
    loadHomeEnvelope.mockResolvedValue(structuredClone(liveEnv));
    stageDraftTree.mockResolvedValue({ ok: true });
    await setReviewQuotes([{ quote: 'Great', author: 'Sam' }], { score: ' 4.8 out of 5 ', count: ' 30 reviews ' });
    const staged = stageDraftTree.mock.calls[0]![1] as { root: { content: { reviews: { summary?: unknown } } } };
    expect(staged.root.content.reviews.summary).toEqual({ score: '4.8 out of 5', count: '30 reviews' });
  });

  it('STRIPS a fabricated rating when the maker gives none (or only half of it)', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    // The draft still carries Bohdi's build-time invented rating.
    readDraftTree.mockResolvedValue({ root: { content: { reviews: { title: 'Kind words', summary: { score: '4.9 out of 5', count: '200+ happy customers' } } } } });
    stageDraftTree.mockResolvedValue({ ok: true });
    // No summary → the invented one is deleted, never published.
    await setReviewQuotes([{ quote: 'Real', author: 'Dana' }]);
    const staged = stageDraftTree.mock.calls[0]![1] as { root: { content: { reviews: Record<string, unknown> } } };
    expect(staged.root.content.reviews['summary']).toBeUndefined();

    // A half-filled rating (score but no count) is incomplete → also stripped.
    stageDraftTree.mockClear();
    readDraftTree.mockResolvedValue({ root: { content: { reviews: { title: 'Kind words', summary: { score: '4.9 out of 5', count: '200+' } } } } });
    await setReviewQuotes([{ quote: 'Real', author: 'Dana' }], { score: '5 stars', count: '' });
    const staged2 = stageDraftTree.mock.calls[0]![1] as { root: { content: { reviews: Record<string, unknown> } } };
    expect(staged2.root.content.reviews['summary']).toBeUndefined();
  });

  it('rejects an all-empty submission without touching the draft or the shop', async () => {
    const res = await setReviewQuotes([{ quote: '', author: '' }]);
    expect(res.ok).toBe(false);
    expect(getCurrentShop).not.toHaveBeenCalled();
    expect(stageDraftTree).not.toHaveBeenCalled();
  });

  it('fails cleanly with no store', async () => {
    getCurrentShop.mockResolvedValue(null);
    const res = await setReviewQuotes([{ quote: 'q', author: 'a' }]);
    expect(res.ok).toBe(false);
    expect(stageDraftTree).not.toHaveBeenCalled();
  });
});

describe('setFindUsRows (real event dates)', () => {
  it('stages the maker’s real dates with a derived day echo, marks find-us made, and un-hides it', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    readDraftTree.mockResolvedValue({
      root: { content: { founder: { findUs: { label: 'Find us', rows: [] } }, hiddenSections: ['findUs'] } },
    });
    stageDraftTree.mockResolvedValue({ ok: true });

    const res = await setFindUsRows([
      { where: 'Providence Winter Market', date: '2026-08-15', time: '9am – 2pm' },
      { where: '', date: '', time: '' }, // blank row dropped
    ]);
    expect(res.ok).toBe(true);
    const staged = stageDraftTree.mock.calls[0]![1] as {
      root: { content: { founder: { findUs: { label: string; rows: Record<string, string>[] } }; madeYours?: string[]; hiddenSections?: string[] } };
    };
    const rows = staged.root.content.founder.findUs.rows;
    expect(rows).toHaveLength(1);
    expect(rows[0]!['where']).toBe('Providence Winter Market');
    expect(rows[0]!['date']).toBe('2026-08-15');
    expect(rows[0]!['time']).toBe('9am – 2pm');
    expect(rows[0]!['day']).toMatch(/Aug 15/); // day echo derived from the date
    expect(staged.root.content.founder.findUs.label).toBe('Find us'); // preserved
    expect(staged.root.content.madeYours).toContain('findUs');
    expect(staged.root.content.hiddenSections).not.toContain('findUs');
  });

  it('sets a fallback label when the store has no find-us section yet', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    readDraftTree.mockResolvedValue(null);
    loadHomeEnvelope.mockResolvedValue({ kind: 'archetype', content: { founder: { quote: 'q', attribution: 'a' } } });
    stageDraftTree.mockResolvedValue({ ok: true });
    await setFindUsRows([{ where: 'Market', date: '2026-08-15', time: '10am' }]);
    const staged = stageDraftTree.mock.calls[0]![1] as { root: { content: { founder: { findUs: { label: string } } } } };
    expect(staged.root.content.founder.findUs.label.length).toBeGreaterThan(0);
  });

  it('rejects an all-empty submission without touching the draft or the shop', async () => {
    const res = await setFindUsRows([{ where: '', date: '', time: '' }]);
    expect(res.ok).toBe(false);
    expect(getCurrentShop).not.toHaveBeenCalled();
    expect(stageDraftTree).not.toHaveBeenCalled();
  });

  it('fails cleanly with no store', async () => {
    getCurrentShop.mockResolvedValue(null);
    const res = await setFindUsRows([{ where: 'Market', date: '2026-08-15', time: '10am' }]);
    expect(res.ok).toBe(false);
    expect(stageDraftTree).not.toHaveBeenCalled();
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

  it('publishStore blocks (and does not publish) while the draft is dishonest', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    // A fresh draft — nothing made-yours, nothing hidden — is blocked on all four
    // honesty sections (about, products, reviews, dates).
    readDraftTree.mockResolvedValue({ root: { content: {} } });
    const res = await publishStore();
    expect(res.ok).toBe(false);
    expect(publishDraft).not.toHaveBeenCalled();
  });

  it('publishStore publishes once the draft is honest', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    readDraftTree.mockResolvedValue({
      root: { content: { madeYours: ['founder', 'goods'], hiddenSections: ['reviews', 'findUs'] } },
    });
    publishDraft.mockResolvedValue({ ok: true });
    const res = await publishStore();
    expect(res.ok).toBe(true);
    expect(publishDraft).toHaveBeenCalledWith('t1');
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

  it('publishStore blocks while placeholder products remain, even if the draft is honest', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    readDraftTree.mockResolvedValue({
      root: { content: { madeYours: ['founder', 'goods'], hiddenSections: ['reviews', 'findUs'] } },
    });
    hasPlaceholderProducts.mockResolvedValue(true);
    const res = await publishStore();
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain('your products');
    expect(publishDraft).not.toHaveBeenCalled();
  });
});

describe('saveWalkProduct', () => {
  it('first real product clears placeholders and marks goods made-yours', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    hasRealProducts.mockResolvedValue(false); // none yet → this is the first
    insertRealProduct.mockResolvedValue({ id: 'l1', slug: 'amber-candle' });
    readDraftTree.mockResolvedValue(null);
    loadHomeEnvelope.mockResolvedValue({ kind: 'archetype', content: {} });
    stageDraftTree.mockResolvedValue({ ok: true });

    const res = await saveWalkProduct({ name: 'Amber Candle', price: '$24', shortDescription: 's', description: 'd', uploadId: 'up1' });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.id).toBe('l1');
    expect(insertRealProduct).toHaveBeenCalledWith(expect.anything(), 't1', expect.objectContaining({ name: 'Amber Candle', priceCents: 2400, uploadId: 'up1' }));
    expect(clearPlaceholderProducts).toHaveBeenCalledWith(expect.anything(), 't1');
    expect(stageDraftTree).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ root: expect.objectContaining({ content: expect.objectContaining({ madeYours: ['goods'] }) }) }),
    );
  });

  it('a later product does NOT clear placeholders or re-stage goods', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    hasRealProducts.mockResolvedValue(true); // already has real products
    insertRealProduct.mockResolvedValue({ id: 'l2', slug: 'x' });

    const res = await saveWalkProduct({ name: 'Second', price: '18' });
    expect(res.ok).toBe(true);
    expect(clearPlaceholderProducts).not.toHaveBeenCalled();
    expect(stageDraftTree).not.toHaveBeenCalled();
  });

  it('rejects an unparseable price without inserting', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    const res = await saveWalkProduct({ name: 'Amber', price: 'free' });
    expect(res.ok).toBe(false);
    expect(insertRealProduct).not.toHaveBeenCalled();
  });

  it('rejects a blank name', async () => {
    const res = await saveWalkProduct({ name: '   ', price: '$24' });
    expect(res.ok).toBe(false);
    expect(getCurrentShop).not.toHaveBeenCalled();
  });

  it('fails cleanly with no store', async () => {
    getCurrentShop.mockResolvedValue(null);
    const res = await saveWalkProduct({ name: 'Amber', price: '$24' });
    expect(res.ok).toBe(false);
    expect(insertRealProduct).not.toHaveBeenCalled();
  });
});

describe('updateWalkProduct', () => {
  it('updates an existing product with the parsed price', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    updateRealProduct.mockResolvedValue(undefined);
    const res = await updateWalkProduct('l1', { name: 'Amber', price: '$30', description: 'nicer' });
    expect(res.ok).toBe(true);
    expect(updateRealProduct).toHaveBeenCalledWith(
      expect.anything(),
      't1',
      'l1',
      expect.objectContaining({ name: 'Amber', priceCents: 3000 }),
    );
  });

  it('rejects a bad price without touching the row', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    const res = await updateWalkProduct('l1', { name: 'Amber', price: '' });
    expect(res.ok).toBe(false);
    expect(updateRealProduct).not.toHaveBeenCalled();
  });
});

describe('removeWalkProduct', () => {
  it('un-marks goods when the last real product is removed', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    softDeleteProduct.mockResolvedValue(undefined);
    hasRealProducts.mockResolvedValue(false); // none left after removal
    readDraftTree.mockResolvedValue({ root: { content: { madeYours: ['goods'] } } });
    stageDraftTree.mockResolvedValue({ ok: true });

    const res = await removeWalkProduct('l1');
    expect(res.ok).toBe(true);
    expect(softDeleteProduct).toHaveBeenCalledWith(expect.anything(), 't1', 'l1');
    const staged = stageDraftTree.mock.calls[0]![1] as { root: { content: { madeYours?: string[] } } };
    expect(staged.root.content.madeYours ?? []).not.toContain('goods');
  });

  it('leaves goods made when real products remain', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    softDeleteProduct.mockResolvedValue(undefined);
    hasRealProducts.mockResolvedValue(true);

    const res = await removeWalkProduct('l1');
    expect(res.ok).toBe(true);
    expect(stageDraftTree).not.toHaveBeenCalled();
  });
});

describe('uploadProductPhoto', () => {
  it('rejects a disallowed file type', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    const fd = new FormData();
    fd.set('file', new File(['x'], 'a.gif', { type: 'image/gif' }));
    const res = await uploadProductPhoto(fd);
    expect(res.ok).toBe(false);
    expect(storageUpload).not.toHaveBeenCalled();
  });

  it('uploads a valid image and records the uploads row', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    const fd = new FormData();
    fd.set('file', new File(['x'], 'candle.png', { type: 'image/png' }));
    const res = await uploadProductPhoto(fd);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.uploadId).toBe('up1');
      expect(res.url).toBe('https://x/p.jpg');
    }
    expect(storageUpload).toHaveBeenCalled();
    expect(uploadsInsert).toHaveBeenCalled();
  });

  it('rejects when no store', async () => {
    getCurrentShop.mockResolvedValue(null);
    const fd = new FormData();
    fd.set('file', new File(['x'], 'candle.png', { type: 'image/png' }));
    const res = await uploadProductPhoto(fd);
    expect(res.ok).toBe(false);
  });
});

describe('draftProductCopyAction', () => {
  it('returns Bohdi drafted copy for a named product', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    loadNicheVoice.mockResolvedValue({ displayName: 'candle maker', body: '' });
    draftProductCopy.mockResolvedValue({ shortDescription: 'Hand-poured', description: 'A calming candle.' });
    const res = await draftProductCopyAction('Amber Candle', 'lavender soy');
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.copy.shortDescription).toBe('Hand-poured');
  });

  it('rejects a blank product name before calling Bohdi', async () => {
    const res = await draftProductCopyAction('  ', 'anything');
    expect(res.ok).toBe(false);
    expect(draftProductCopy).not.toHaveBeenCalled();
  });
});
