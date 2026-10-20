import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({ features: new Set<string>() }));
const loadCollections = vi.hoisted(() => vi.fn());
vi.mock('./data', () => ({ loadCardData: async () => ({ name: 'Saltmarsh & Lace' }) }));
vi.mock('@/lib/backend/features', () => ({ loadSiteFeatures: async () => state.features }));
vi.mock('@/lib/storefront/catalog', () => ({ loadCatalog: async () => ({ products: [] }), loadCollections }));
vi.mock('@/lib/storefront/promotions-load', () => ({ loadRunningSale: async () => null }));
vi.mock('@/lib/backend/testimonials/queries', () => ({ listTestimonials: async () => [] }));

const { loadShorelineData } = await import('./shoreline-data');

const piece = { slug: 'tray', name: 'Tray', price: '$20', description: '', status: 'active', media: [], variations: [] };

beforeEach(() => {
  loadCollections.mockReset().mockResolvedValue([
    { slug: 'trays', view: { name: 'Trays' }, products: [piece] },
    { slug: 'empty', view: { name: 'Empty' }, products: [] },
  ]);
});

describe('loadShorelineData', () => {
  it('shows her collections with pieces on Full', async () => {
    state.features = new Set(['catalog', 'collections']);
    const site = await loadShorelineData({} as never, 't1');
    expect(site.collections).toEqual([{ slug: 'trays', name: 'Trays', products: [piece] }]);
  });
  it('has no collections on Market, so no row and no collection pages', async () => {
    state.features = new Set(['catalog']);
    const site = await loadShorelineData({} as never, 't1');
    expect(site.pages).toBe(true);
    expect(site.collections).toEqual([]);
    expect(loadCollections).not.toHaveBeenCalled();
  });
  it('has neither on Showcase', async () => {
    state.features = new Set(['collections']);
    expect((await loadShorelineData({} as never, 't1')).collections).toEqual([]);
  });
});
