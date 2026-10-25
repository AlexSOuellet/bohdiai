import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LINK_TARGETS } from './links';
import { render } from '@testing-library/react';
import { isValidElement, type ReactElement } from 'react';
import { EMPTY_MOMENT } from '@/lib/backend/moment/moment-form';
import { EMPTY_SECTION, SECTION_KEYS, type SiteSections } from '@/lib/backend/sections/sections-form';
import { EMPTY_PROFILE } from '@/lib/backend/profile/profile-form';
import { keyWords } from '@/lib/site-words/words';
import { FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX } from './words';
import type * as FromHomes from './from-homes';
import type { FamilyHomes } from './from-homes';

/** Test words: every spot says its own key. */
const W = keyWords(FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX);

const site = vi.hoisted(() => ({ getSiteWords: vi.fn(), loadFamilyHomes: vi.fn(), features: { cart: true, catalog: true } }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({}) }));
vi.mock('next/navigation', async (importOriginal) => ({ ...(await importOriginal<object>()), useRouter: () => ({ refresh: () => undefined }) }));
vi.mock('@/lib/site-words/queries', () => ({ getSiteWords: site.getSiteWords }));
vi.mock('./from-homes', async (importOriginal) => ({ ...(await importOriginal<typeof FromHomes>()), loadFamilyHomes: site.loadFamilyHomes }));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => new Set(Object.entries(site.features).flatMap(([k, on]) => (on ? [k] : []))) }));
vi.mock('@/lib/storefront/metadata', () => ({ loadShopWords: async () => ({ cart: { eyebrow: 'shop.cart.eyebrow', title: 'shop.cart.title', body: 'shop.cart.body', cta: 'shop.cart.cta' } }) }));
vi.mock('@/lib/storefront/promotions-load', () => ({ loadRunningSale: async () => ({ percentOff: 20 }) }));

import { MAIN_STREET_SPEC, sceneForFamily } from './builder';
import type { ProductView } from '../content';

/** A family page with a site behind it renders through an async server component;
 *  run it to the element it paints. */
async function painted(el: ReactElement): Promise<ReactElement> {
  const { type, props } = el as ReactElement<Record<string, unknown>, (p: Record<string, unknown>) => Promise<ReactElement>>;
  const out = await type(props);
  expect(isValidElement(out)).toBe(true);
  return out;
}

function productRows(n: number): ProductView[] {
  return Array.from({ length: n }, (_, i) => ({
    slug: `p-${i}`,
    name: `Piece ${i}`,
    price: `$${i + 1}`,
    description: '',
    shortDescription: 'a thing',
    status: 'active' as const,
    media: [{ kind: 'image' as const, url: '/x.webp', alt: `Piece ${i}` }],
    variations: [],
  }));
}

function scene() {
  return {
    composition: 'close on a workbench',
    subject: 'steam curling off a pot',
    environment: 'a dim workshop',
    atmosphere: 'warm and patient',
    camera: 'locked off, shallow depth',
    lighting: 'a single amber lamp',
    style: 'photographic, deep shadow',
  };
}

function submission(kind: 'video' | 'still') {
  return {
    content: {
      shopName: 'Tannery Row',
      identity: { wordmark: 'Tannery Row', nav: ['Shop', 'About'] },
      moment: {
        media: { kind, prompt: scene(), alt: 'a workshop bench' },
        story: ['full-grain hide', 'every hole by hand'],
        eyebrow: 'Made one at a time',
        brand: 'Tannery Row',
        ctaLabel: 'See the work',
      },
      goods: { title: 'From the bench' },
      founder: {
        quote: 'I started with one knife and a scrap of hide, and I still cut every piece myself',
        attribution: 'Sam, founder',
        photo: { prompt: 'the maker at the bench', alt: 'Sam at the bench' },
      },
      close: { label: 'Come by', headline: 'Built to outlast you', ctaLabel: 'Order custom' },
    },
    products: [
      { name: 'Belt', slug: 'belt', shortDescription: 'a belt', description: 'a sturdy leather belt', basePriceCents: 8800, imagePrompt: 'a belt on wood' },
      { name: 'Wallet', slug: 'wallet', shortDescription: 'a wallet', description: 'a bifold leather wallet', basePriceCents: 6500, imagePrompt: 'a wallet on wood' },
      { name: 'Key fob', slug: 'key-fob', shortDescription: 'a fob', description: 'a small leather key fob', basePriceCents: 2400, imagePrompt: 'a key fob on wood' },
    ],
  };
}

describe('MAIN_STREET_SPEC.render — the site’s words', () => {
  beforeEach(() => {
    site.getSiteWords.mockReset().mockResolvedValue(W);
    site.loadFamilyHomes.mockReset();
  });

  it('reads the site’s words for an old sample whose page record holds its content', async () => {
    const parsed = MAIN_STREET_SPEC.parseSubmission(submission('video'));
    if (!parsed.ok) throw new Error('fixture failed to parse');
    const content = MAIN_STREET_SPEC.toPayload(parsed.authored).content;
    const el = MAIN_STREET_SPEC.render({ content, lookKey: 'main-street-ember', products: [], page: 'shop', tenantId: 't1' });
    const { container } = render(await painted(el));
    expect(site.getSiteWords).toHaveBeenCalledWith(expect.anything(), 't1', FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX);
    expect(site.loadFamilyHomes).not.toHaveBeenCalled();
    expect(container.querySelector('a[href="/shop"]')?.textContent).toBe(W.navShop);
    expect(container.querySelector('[data-ms-shop]')?.textContent).toBe(W.emptyShop);
  });

  it('reads the site’s words for a site built from its homes, down to its market dates', async () => {
    const sections = Object.fromEntries(SECTION_KEYS.map((k) => [k, { ...EMPTY_SECTION, ...(k === 'markets' ? { title: 'Find me at' } : {}) }])) as SiteSections;
    const homes: FamilyHomes = {
      name: 'Ember Candle Co', sellsOnline: true, linkTargets: LINK_TARGETS, moment: { ...EMPTY_MOMENT, media: null, photos: [] }, sections, profile: EMPTY_PROFILE,
      portraitUrl: null, testimonials: [],
      dates: [{ id: 'd1', date: '2026-10-17', endDate: '', name: 'Harvest Fair', town: 'Wickford', hours: '9–4', address: '', booth: '', url: '', canceled: false }],
      gallery: [],
    };
    site.loadFamilyHomes.mockResolvedValue(homes);
    const el = MAIN_STREET_SPEC.render({ content: { design: 'family' }, lookKey: 'main-street-ember', products: [], page: 'events', tenantId: 't1' });
    const { container } = render(await painted(el));
    expect(site.loadFamilyHomes).toHaveBeenCalledWith(expect.anything(), 't1');
    expect(container.querySelector('a[href="/cart"]')?.textContent).toBe(W.navCart);
    expect(container.querySelector('.ms-ev-where')?.textContent).toBe(W.marketWhere);
    expect(container.querySelector('.ms-ev-directions')?.textContent).toBe(W.getDirections);
  });
});

describe('MAIN_STREET_SPEC — the plans (Full sells online)', () => {
  const sections = Object.fromEntries(SECTION_KEYS.map((k) => [k, EMPTY_SECTION])) as SiteSections;
  const homes = (sellsOnline: boolean): FamilyHomes => ({
    name: 'Ember Candle Co', sellsOnline, linkTargets: LINK_TARGETS, moment: { ...EMPTY_MOMENT, media: null, photos: [] }, sections, profile: EMPTY_PROFILE, portraitUrl: null, testimonials: [], dates: [], gallery: [],
  });
  const cart = {
    lines: [{ id: 'l1', slug: 'tide', name: 'Tide candle', price: '$40', available: true }],
    codes: false,
    subtotal: '$40',
    total: '$40',
  };

  beforeEach(() => {
    site.getSiteWords.mockResolvedValue(W);
    site.features.cart = true;
    site.features.catalog = true;
  });

  describe('Showcase (no catalog): no shop, no prices', () => {
    beforeEach(() => {
      site.features.cart = false;
      site.features.catalog = false;
      site.loadFamilyHomes.mockResolvedValue(homes(false));
    });

    it('has no shop, collections or collection page', async () => {
      for (const page of ['shop', 'collections', 'collection'] as const) {
        const el = MAIN_STREET_SPEC.render({ content: { design: 'family' }, lookKey: 'main-street-ember', products: productRows(2), page, tenantId: 't1' });
        await expect(painted(el)).rejects.toThrow();
      }
    });

    it('has no page for a piece, and no cart page', async () => {
      const product = MAIN_STREET_SPEC.renderProduct!({ content: { design: 'family' }, lookKey: 'main-street-ember', product: productRows(1)[0]!, tenantId: 't1' });
      await expect(painted(product)).rejects.toThrow();
      const el = MAIN_STREET_SPEC.renderCart!({ content: { design: 'family' }, lookKey: 'main-street-ember', cart, tenantId: 't1' });
      const chrome = await painted(el);
      await expect(painted((chrome.props as { children: ReactElement }).children)).rejects.toThrow();
    });

    it('the home shows no pieces and no prices, and the menu has no shop', async () => {
      const products = productRows(3).map((p) => ({ ...p, price: '$50' }));
      const el = MAIN_STREET_SPEC.render({ content: { design: 'family' }, lookKey: 'main-street-ember', products, tenantId: 't1' });
      const { container } = render(await painted(el));
      expect(container.textContent).not.toContain('$50');
      expect(container.textContent).not.toContain('Piece 0');
      expect(container.querySelector('a[href="/shop"]')).toBeNull();
      expect(container.querySelector('a[href="/collections"]')).toBeNull();
    });
  });

  it('a market’s page is there on Market and Full, never on Showcase', async () => {
    site.loadFamilyHomes.mockResolvedValue(homes(false));
    const market = { marketId: 'm1', name: 'Harvest Fair', date: '2026-10-17', endDate: '', town: '', booth: '', state: 'after' as const, pieces: [], methods: [] };
    const run = async (): Promise<ReactElement> => {
      const chrome = await painted(MAIN_STREET_SPEC.renderMarket!({ content: { design: 'family' }, lookKey: 'main-street-ember', market, tenantId: 't1' }));
      return painted(chrome);
    };
    (site.features as Record<string, boolean>)['market_shop'] = true;
    const { container } = render(await run());
    expect(container.querySelector('h1')?.textContent).toBe('Harvest Fair');
    (site.features as Record<string, boolean>)['market_shop'] = false;
    await expect(run()).rejects.toThrow();
  });

  it('shows the running sale price on the pieces in the shop', async () => {
    site.loadFamilyHomes.mockResolvedValue(homes(true));
    const products = productRows(1).map((p) => ({ ...p, price: '$50', priceCents: 5000 }));
    const el = MAIN_STREET_SPEC.render({ content: { design: 'family' }, lookKey: 'main-street-ember', products, page: 'shop', tenantId: 't1' });
    const { container } = render(await painted(el));
    expect(container.textContent).toContain('$40');
    expect(container.textContent).not.toContain('$50');
  });

  /** The cart page's body (an async piece inside the family chrome), run to what it paints. */
  async function cartBody(): Promise<HTMLElement> {
    const el = MAIN_STREET_SPEC.renderCart!({ content: { design: 'family' }, lookKey: 'main-street-ember', cart, tenantId: 't1' });
    const chrome = await painted(el);
    const body = await painted((chrome.props as { children: ReactElement }).children);
    return render(body).container;
  }

  it('paints the cart with her pieces, the sums and the order form on Full', async () => {
    site.loadFamilyHomes.mockResolvedValue(homes(true));
    const c = await cartBody();
    expect(c.querySelector('.ms-cart-title')?.textContent).toBe(W.cart.title);
    expect(c.querySelector('.ms-cart-line a')?.getAttribute('href')).toBe('/listings/tide');
    expect(c.querySelector('.ms-cart-total dd')?.textContent).toBe('$40');
    expect(c.querySelector('form')).not.toBeNull();
  });

  it('a site without the cart lands on the plain page in its own words', async () => {
    site.loadFamilyHomes.mockResolvedValue(homes(false));
    site.features.cart = false;
    const c = await cartBody();
    expect(c.querySelector('.ms-cart')).toBeNull();
    expect(c.querySelector('h1')?.textContent).toBe('shop.cart.title');
    expect(c.querySelector('a')?.getAttribute('href')).toBe('/shop');
  });
});

describe('MAIN_STREET_SPEC.render — accentOverride baked into skin', () => {
  it('paints the baked accentOverride as the store accent (emitted as --ms-accent in the style tag)', () => {
    // Use the spec's real content shape via parseSubmission + toPayload
    const parsed = MAIN_STREET_SPEC.parseSubmission(submission('video'));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const content = MAIN_STREET_SPEC.toPayload(parsed.authored).content;
    // Pick the first available skin — 'main-street-ember' — which is a light skin
    const el = MAIN_STREET_SPEC.render({
      content,
      lookKey: 'main-street-ember',
      products: [],
      page: 'about',
      accentOverride: '#1d3a2e',
    });
    const { container } = render(el);
    // skinVarsCss emits --ms-accent:${p.accent} in a <style> tag; the raw hex
    // must appear literally in the rendered HTML (not converted by jsdom since
    // it's inside a <style> string, not a computed property)
    expect(container.innerHTML).toContain('#1d3a2e');
  });
});

describe('MAIN_STREET_SPEC.render — goods treatment preview (?goods=)', () => {
  it('forces the goods module treatment when asked, instead of the size fallback', () => {
    const parsed = MAIN_STREET_SPEC.parseSubmission(submission('video'));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const content = MAIN_STREET_SPEC.toPayload(parsed.authored).content;
    const el = MAIN_STREET_SPEC.render({
      content,
      lookKey: 'main-street-ember',
      products: productRows(6),
      goodsTreatment: 'module',
    });
    const { container } = render(el);
    expect(container.querySelectorAll('[data-ms-module-item]').length).toBe(6);
  });
});

describe('MAIN_STREET_SPEC.mediaJobs — hero follows the authored kind', () => {
  it('generates a VIDEO hero (JSON prompt) when kind is video', () => {
    const parsed = MAIN_STREET_SPEC.parseSubmission(submission('video'));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const hero = MAIN_STREET_SPEC.mediaJobs(parsed.authored).find((j) => j.id === 'hero')!;
    expect(hero.kind).toBe('video');
    expect(JSON.parse(hero.prompt).loop).toMatch(/seamless/i);
  });

  it('generates a STILL hero (prose prompt) when kind is still', () => {
    const parsed = MAIN_STREET_SPEC.parseSubmission(submission('still'));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const hero = MAIN_STREET_SPEC.mediaJobs(parsed.authored).find((j) => j.id === 'hero')!;
    expect(hero.kind).toBe('still');
    expect(hero.aspect).toBe('16:9');
    expect(() => JSON.parse(hero.prompt)).toThrow(); // prose, not JSON
  });
});

function withCollage(kind: 'video' | 'still') {
  const s = submission(kind);
  (s.content.moment as Record<string, unknown>)['collageShots'] = [
    { prompt: scene(), alt: 'a wide of the bench' },
    { prompt: scene(), alt: 'a close detail' },
    { prompt: scene(), alt: 'a small grouping of goods' },
  ];
  return s;
}

describe('MAIN_STREET_SPEC — collage shot generation', () => {
  it('emits a still media job per collage shot (group feature)', () => {
    const parsed = MAIN_STREET_SPEC.parseSubmission(withCollage('video'));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const collage = MAIN_STREET_SPEC.mediaJobs(parsed.authored).filter((j) => j.id.startsWith('collage:'));
    expect(collage).toHaveLength(3);
    expect(collage.every((j) => j.kind === 'still')).toBe(true);
    expect(collage.every((j) => j.group === 'feature')).toBe(true);
  });

  it('emits no collage jobs when the build authored none', () => {
    const parsed = MAIN_STREET_SPEC.parseSubmission(submission('video'));
    if (!parsed.ok) return;
    expect(MAIN_STREET_SPEC.mediaJobs(parsed.authored).filter((j) => j.id.startsWith('collage:'))).toHaveLength(0);
  });

  it('folds generated collage urls into content.moment.collageShots', () => {
    const parsed = MAIN_STREET_SPEC.parseSubmission(withCollage('video'));
    if (!parsed.ok) return;
    const urls = { 'collage:0': 'https://cdn.example.com/c0.jpg', 'collage:1': 'https://cdn.example.com/c1.jpg', 'collage:2': 'https://cdn.example.com/c2.jpg' };
    const withMedia = MAIN_STREET_SPEC.applyMedia(parsed.authored, urls);
    const shots = withMedia.content.moment.collageShots!;
    expect(shots.map((s) => s.url)).toEqual([
      'https://cdn.example.com/c0.jpg',
      'https://cdn.example.com/c1.jpg',
      'https://cdn.example.com/c2.jpg',
    ]);
  });
});

describe('MAIN_STREET_SPEC.render — brand palette takes over', () => {
  function content() {
    const parsed = MAIN_STREET_SPEC.parseSubmission(submission('video'));
    if (!parsed.ok) throw new Error('fixture failed to parse');
    return MAIN_STREET_SPEC.toPayload(parsed.authored).content;
  }

  it('paints the brand base and accent as --ms-bg / --ms-accent', () => {
    const { container } = render(MAIN_STREET_SPEC.render({
      content: content(), lookKey: 'main-street-ember', products: [], page: 'about',
      brandPalette: { base: '#0b0b0b', accent: '#3dae3f' },
    }));
    expect(container.innerHTML).toContain('--ms-bg:#0b0b0b');
    expect(container.innerHTML).toContain('--ms-accent:#3dae3f');
  });

  it('ignores accentOverride when a brand palette is present', () => {
    const { container } = render(MAIN_STREET_SPEC.render({
      content: content(), lookKey: 'main-street-ember', products: [], page: 'about',
      brandPalette: { base: '#0b0b0b', accent: '#3dae3f' }, accentOverride: '#1d3a2e',
    }));
    expect(container.innerHTML).not.toContain('#1d3a2e');
  });

  it('switches the family wallpaper off under a brand palette', () => {
    const { container } = render(MAIN_STREET_SPEC.render({
      content: content(), lookKey: 'main-street-ember', products: [], page: 'about', mood: 'cozy',
      brandPalette: { base: '#0b0b0b', accent: '#3dae3f' },
    }));
    expect(container.innerHTML).toMatch(/--ms-texture-opacity:0\}/);
  });

  it('applies the brand palette on the shell path too', () => {
    const renderShell = MAIN_STREET_SPEC.renderShell;
    if (renderShell === undefined) throw new Error('Main Street has no shell');
    const { container } = render(renderShell({
      content: content(), lookKey: 'main-street-ember', children: null,
      brandPalette: { base: '#0b0b0b', accent: '#3dae3f' },
    }));
    expect(container.innerHTML).toContain('--ms-accent:#3dae3f');
  });
});

describe('sceneForFamily — which families paint the site’s background photo', () => {
  const library = { url: '/scenes/marsh.webp', focus: 'center 62%' };
  const own = { url: 'https://cdn/wood.jpg', focus: 'center', own: true, tone: 'dark' as const };
  it('Scenic paints its scene, never the site’s own background', () => {
    expect(sceneForFamily('scenic', library, own)).toBe(library);
    expect(sceneForFamily('scenic', null, own)).toBeNull();
  });
  it('Rustic paints the site’s own background, never Scenic’s scene', () => {
    expect(sceneForFamily('rustic', library, own)).toBe(own);
    expect(sceneForFamily('rustic', library)).toBeNull();
  });
  it('the other families keep their own wallpaper', () => {
    expect(sceneForFamily('cozy', library, own)).toBeNull();
  });
});
