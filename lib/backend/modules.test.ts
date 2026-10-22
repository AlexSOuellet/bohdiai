import { describe, it, expect } from 'vitest';
import { navFor, withoutItem, BACKEND_MODULES, type BackendModule } from './modules';
import type { FeatureKey } from './features';

const modules: BackendModule[] = [
  { feature: null, section: 'Site', items: [{ label: 'Home', href: '/manage' }] },
  { feature: 'catalog', section: 'Catalog', items: [{ label: 'Products', href: '/manage/products' }] },
  { feature: 'video', section: 'Catalog', items: [{ label: 'Videos', href: '/manage/videos' }] },
];

describe('navFor', () => {
  it('always includes modules with no feature, and only switched-on features otherwise', () => {
    const on = new Set<FeatureKey>(['catalog']);
    expect(navFor(modules, on)).toEqual([
      { section: 'Site', items: [{ label: 'Home', href: '/manage' }] },
      { section: 'Catalog', items: [{ label: 'Products', href: '/manage/products' }] },
    ]);
  });
  it('merges items of the same section in module order', () => {
    const on = new Set<FeatureKey>(['catalog', 'video']);
    expect(navFor(modules, on)[1]?.items.map((i) => i.label)).toEqual(['Products', 'Videos']);
  });
  it('drops empty sections', () => {
    expect(navFor(modules, new Set()).map((s) => s.section)).toEqual(['Site']);
  });
});

describe('catalog in the menu', () => {
  it('shows Products with the catalog, and Collections only with the collections switch (Full)', () => {
    expect(navFor(BACKEND_MODULES, new Set(['catalog']))).toContainEqual({ section: 'Catalog', items: [{ label: 'Products', href: '/manage/products' }] });
    expect(navFor(BACKEND_MODULES, new Set(['catalog', 'collections']))).toContainEqual({
      section: 'Catalog',
      items: [
        { label: 'Products', href: '/manage/products' },
        { label: 'Collections', href: '/manage/collections' },
      ],
    });
    expect(navFor(BACKEND_MODULES, new Set()).map((s) => s.section)).not.toContain('Catalog');
  });
});

describe('a business card site in the menu', () => {
  it('adds the Schedule under Events when switched on', () => {
    const nav = navFor(BACKEND_MODULES, new Set(['profile', 'gallery', 'market_dates']));
    expect(nav.find((s) => s.section === 'Your site')?.items.map((i) => i.label)).toEqual(['About you', 'Scrolling line', 'Contact information', 'Socials', 'Gallery']);
    expect(nav.find((s) => s.section === 'Events')?.items).toEqual([{ label: 'Schedule', href: '/manage/markets' }]);
  });

  it('shows About you and Gallery under Your site, and no catalog', () => {
    expect(navFor(BACKEND_MODULES, new Set(['profile', 'gallery']))).toEqual([
      { section: '', items: [{ label: 'Home', href: '/manage' }] },
      {
        section: 'Your site',
        items: [
          { label: 'About you', href: '/manage/profile' },
          { label: 'Scrolling line', href: '/manage/marquee' },
          { label: 'Contact information', href: '/manage/contact' },
          { label: 'Socials', href: '/manage/socials' },
          { label: 'Gallery', href: '/manage/gallery' },
        ],
      },
      { section: '', items: [{ label: 'Contact support', href: '/manage/support' }] },
    ]);
  });
});

describe('Your plan in the menu', () => {
  it('sits under Settings at the bottom of the menu, with Home alone at the top', () => {
    const nav = navFor(BACKEND_MODULES, new Set<FeatureKey>(['plan', 'profile', 'gallery_pieces', 'market_dates']));
    expect(nav[0]).toEqual({ section: '', items: [{ label: 'Home', href: '/manage' }] });
    expect(nav.at(-1)).toEqual({
      section: 'Settings',
      items: [
        { label: 'Your plan', href: '/manage/plan' },
        { label: 'Billing', href: '/manage/billing' },
      ],
    });
    expect(navFor(BACKEND_MODULES, new Set()).map((s) => s.items.map((i) => i.label))).toEqual([['Home'], ['Contact support']]);
  });
});

describe('Showcase in the menu', () => {
  it('shows Products (no Collections, no old Gallery) and the Headline', () => {
    const nav = navFor(BACKEND_MODULES, new Set<FeatureKey>(['gallery_pieces', 'headline', 'profile']));
    expect(nav).toContainEqual({ section: 'Catalog', items: [{ label: 'Products', href: '/manage/products' }] });
    const yours = nav.find((s) => s.section === 'Your site')?.items.map((i) => i.label);
    expect(yours).toEqual(['Headline', 'About you', 'Scrolling line', 'Contact information', 'Socials']);
  });
  it('lists a screen once when two switches open it', () => {
    const nav = navFor(BACKEND_MODULES, new Set<FeatureKey>(['catalog', 'collections', 'gallery_pieces']));
    expect(nav.find((s) => s.section === 'Catalog')?.items.map((i) => i.label)).toEqual(['Products', 'Collections']);
  });
});

describe('Contact support in the menu', () => {
  it('is its own item on the main menu, on every backend, just above Settings', () => {
    const nav = navFor(BACKEND_MODULES, new Set<FeatureKey>(['plan', 'profile']));
    const i = nav.findIndex((s) => s.items.some((it) => it.label === 'Contact support'));
    expect(nav[i]).toEqual({ section: '', items: [{ label: 'Contact support', href: '/manage/support' }] });
    expect(nav[i + 1]?.section).toBe('Settings');
  });
});

describe('Events, Online shop and Getting paid in the menu (Alex, 2026-10-22)', () => {
  const group = (on: FeatureKey[], name: string): string[] => navFor(BACKEND_MODULES, new Set(on)).find((s) => s.section === name)?.items.map((i) => i.label) ?? [];
  const market: FeatureKey[] = ['market_dates', 'market_shop', 'market_records', 'plan'];

  it('groups the schedule, the till, sales and results under Events on Market', () => {
    expect(group(market, 'Events')).toEqual(['Schedule', 'Market POS', 'Sales', 'Results']);
    expect(group(market, 'Online shop')).toEqual([]);
    expect(group(market, 'Settings')).toEqual(['Your plan', 'Billing', 'Getting paid']);
  });

  it('puts Full’s Orders and Promotions under Online shop', () => {
    expect(group([...market, 'cart', 'promotions'], 'Online shop')).toEqual(['Orders', 'Promotions']);
    expect(group([...market, 'cart', 'promotions'], 'Events')).not.toContain('Orders');
  });

  it('has only the Schedule on Showcase', () => {
    expect(group(['market_dates', 'plan'], 'Events')).toEqual(['Schedule']);
    expect(group(['market_dates', 'plan'], 'Settings')).toEqual(['Your plan', 'Billing']);
  });
});

describe('withoutItem', () => {
  it('drops one screen from the menu, and a group it leaves empty', () => {
    const nav = navFor(BACKEND_MODULES, new Set<FeatureKey>(['profile', 'qr_codes']));
    const your = (n: ReturnType<typeof navFor>) => n.find((s) => s.section === 'Your site')?.items.map((i) => i.label);
    expect(your(withoutItem(nav, '/manage/marquee'))).toEqual(['About you', 'Contact information', 'Socials', 'QR code']);
    expect(withoutItem([{ section: 'X', items: [{ label: 'Only', href: '/only' }] }], '/only')).toEqual([]);
  });
});
