import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({ features: new Set<string>() }));
const loadCollections = vi.hoisted(() => vi.fn());
vi.mock('./data', () => ({
  loadCardData: async () => ({
    name: 'Saltmarsh & Lace',
    profile: { kicker: 'Decoupage from Bristol' },
    words: { shoreline: { featured: 'From the shelf', kindWords: 'Kind words', find: 'Find me at', work: 'The work', skyCta: 'Visit the shop', pageTitles: { about: 'About', markets: 'Find me at', contact: 'Get in touch' } } },
  }),
}));
vi.mock('@/lib/backend/features', () => ({ loadSiteFeatures: async () => state.features }));
vi.mock('@/lib/storefront/catalog', () => ({ loadCatalog: async () => ({ products: [] }), loadCollections }));
vi.mock('@/lib/storefront/promotions-load', () => ({ loadRunningSale: async () => null }));
vi.mock('@/lib/storefront/site-gallery', () => ({ loadSiteGallery: async () => [{ key: 'p-tray', url: 'u', alt: '', name: 'Tray' }] }));
vi.mock('@/lib/storefront/home-sections', async (orig) => ({ ...(await orig<object>()), loadHomeSwitches: async () => new Map() }));
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
    expect(site.gallery).toEqual([{ id: 'p-tray', url: 'u', caption: 'Tray' }]);
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
    const one = await loadShorelineData({} as never, 't1');
    expect(one.collections).toEqual([]);
    expect(one.gallery).toEqual([]);
  });
});

describe('loadScenicData', () => {
  const look = { key: 'k', css: '', fontHref: '', seaVideo: null };
  function db(answers: Record<string, { data: unknown; error: { message: string } | null }>) {
    return {
      from: (t: string) => {
        const q: Record<string, unknown> = {};
        for (const k of ['select', 'eq']) q[k] = () => q;
        q['maybeSingle'] = async () => answers[t];
        q['then'] = (f: (v: unknown) => unknown) => Promise.resolve(answers[t]).then(f);
        return q;
      },
    } as never;
  }
  it('takes the opening from the Headline screen and the headings from the site’s section words', async () => {
    state.features = new Set(['catalog']);
    const { loadScenicData } = await import('./shoreline-data');
    const site = await loadScenicData(
      db({
        site_moments: { data: { headline: 'Classic Loafs', sub: 'Bread worth coming home to', cta_label: 'Shop the loaves' }, error: null },
        site_sections: { data: [{ section: 'work', title: 'Fresh from the kitchen', page_title: null }, { section: 'markets', title: 'Find us in person', page_title: 'Markets' }, { section: 'reviews', title: ' ', page_title: null }], error: null },
      }),
      't1',
      look,
    );
    expect(site.card.opening).toEqual({ headline: 'Classic Loafs', line: 'Bread worth coming home to', cta: 'Shop the loaves' });
    expect(site.card.look).toBe(look);
    const W = site.card.words.shoreline;
    expect([W.featured, W.find, W.kindWords, W.work, W.pageTitles.markets, W.pageTitles.contact]).toEqual(['Fresh from the kitchen', 'Find us in person', 'Kind words', 'The work', 'Markets', 'Get in touch']);
  });
  it('keeps the design’s own words where the site has none, and says what couldn’t load', async () => {
    state.features = new Set(['catalog']);
    const { loadScenicData } = await import('./shoreline-data');
    const site = await loadScenicData(db({ site_moments: { data: null, error: null }, site_sections: { data: null, error: null } }), 't1', look);
    expect(site.card.opening).toEqual({ headline: 'Saltmarsh & Lace', line: 'Decoupage from Bristol', cta: 'Visit the shop' });
    await expect(loadScenicData(db({ site_moments: { data: null, error: { message: 'x' } }, site_sections: { data: [], error: null } }), 't1', look)).rejects.toThrow('opening');
    await expect(loadScenicData(db({ site_moments: { data: null, error: null }, site_sections: { data: null, error: { message: 'x' } } }), 't1', look)).rejects.toThrow('section headings');
  });
});
