import { describe, it, expect } from 'vitest';
import { navFor, withoutItem, entryFor, sectionFor, currentItem, BACKEND_MODULES, MY_SITE_PATH, type BackendModule } from './modules';
import type { FeatureKey } from './features';

const modules: BackendModule[] = [
  { feature: null, section: 'Site', items: [{ label: 'Home', href: '/manage' }] },
  { feature: 'catalog', section: 'Catalog', items: [{ label: 'Products', href: '/manage/products' }] },
  { feature: 'video', section: 'Catalog', items: [{ label: 'Videos', href: '/manage/videos' }] },
];

const names = (on: FeatureKey[]): string[] => navFor(BACKEND_MODULES, new Set(on)).map((s) => entryFor(s).label);
const group = (on: FeatureKey[], name: string): string[] => navFor(BACKEND_MODULES, new Set(on)).find((s) => s.section === name)?.items.map((i) => i.label) ?? [];

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

describe('the menu in her words (the redesign, 2026-10-27)', () => {
  const full: FeatureKey[] = ['catalog', 'collections', 'market_dates', 'market_shop', 'market_records', 'cart', 'promotions', 'buyer_accounts', 'headline', 'background', 'profile', 'testimonials', 'try_on', 'qr_codes', 'plan'];

  it('is one short list on Full: Home, Products, Events, Orders, My site, Account, Help', () => {
    expect(names(full)).toEqual(['Home', 'Products', 'Events', 'Orders', 'My site', 'Account', 'Help']);
  });

  it('has only Home and Help with nothing switched on', () => {
    expect(names([])).toEqual(['Home', 'Help']);
  });

  it('opens My site on its own page, and every other group on its first screen', () => {
    const nav = navFor(BACKEND_MODULES, new Set(full));
    const entry = (name: string) => entryFor(nav.find((s) => s.section === name) ?? { section: name, items: [] });
    expect(entry('My site').href).toBe(MY_SITE_PATH);
    expect(entry('Products').href).toBe('/manage/products');
    expect(entry('Events').href).toBe('/manage/markets');
    expect(entry('Help')).toEqual({ label: 'Help', href: '/manage/support' });
  });

  it('keeps every part of her site under My site, in the order a visitor meets them', () => {
    expect(group(full, 'My site')).toEqual(['Headline', 'Background', 'About you', 'Scrolling line', 'Contact information', 'Socials', 'Testimonials', 'Try on a look', 'QR code']);
  });
});

describe('Products in the menu', () => {
  it('shows Products with the catalog, and Collections only with the collections switch (Full)', () => {
    expect(group(['catalog'], 'Products')).toEqual(['Products']);
    expect(group(['catalog', 'collections'], 'Products')).toEqual(['Products', 'Collections']);
    expect(names([])).not.toContain('Products');
  });
  it('lists a screen once when two switches open it (Showcase)', () => {
    expect(group(['catalog', 'collections', 'gallery_pieces'], 'Products')).toEqual(['Products', 'Collections']);
    expect(group(['gallery_pieces'], 'Products')).toEqual(['Products']);
  });
});

describe('Events, Orders and Account (Alex, 2026-10-22)', () => {
  const market: FeatureKey[] = ['market_dates', 'market_shop', 'market_records', 'plan'];

  it('groups the schedule, sales, results and the till under Events on Market', () => {
    expect(group(market, 'Events')).toEqual(['Schedule', 'Sales', 'Results', 'Market POS']);
    expect(group(market, 'Orders')).toEqual([]);
    expect(group(market, 'Account')).toEqual(['Your plan', 'Billing', 'Getting paid']);
  });

  it('puts Full’s Orders, Promotions and Buyers under Orders', () => {
    expect(group([...market, 'cart', 'promotions', 'buyer_accounts'], 'Orders')).toEqual(['Orders', 'Promotions', 'Buyers']);
  });

  it('has only the Schedule on Showcase', () => {
    expect(group(['market_dates', 'plan'], 'Events')).toEqual(['Schedule']);
    expect(group(['market_dates', 'plan'], 'Account')).toEqual(['Your plan', 'Billing']);
  });

  it('keeps Help last, after Account', () => {
    expect(names(['plan', 'profile']).slice(-2)).toEqual(['Account', 'Help']);
  });
});

describe('where a screen belongs', () => {
  const nav = navFor(BACKEND_MODULES, new Set<FeatureKey>(['catalog', 'market_dates', 'market_records', 'profile']));

  it('finds the group of a screen, and of a page inside it', () => {
    expect(sectionFor(nav, '/manage/products/123')?.section).toBe('Products');
    expect(sectionFor(nav, '/manage/profile')?.section).toBe('My site');
    expect(sectionFor(nav, MY_SITE_PATH)?.section).toBe('My site');
    expect(sectionFor(nav, '/manage')?.section).toBe('');
  });

  it('picks Results, not Schedule, for the results page inside the schedule’s path', () => {
    const events = nav.find((s) => s.section === 'Events');
    expect(events === undefined ? null : currentItem(events, '/manage/markets/results')?.label).toBe('Results');
    expect(events === undefined ? null : currentItem(events, '/manage/markets/abc')?.label).toBe('Schedule');
  });
});

describe('withoutItem', () => {
  it('drops one screen from the menu, and a group it leaves empty', () => {
    const nav = navFor(BACKEND_MODULES, new Set<FeatureKey>(['profile', 'qr_codes']));
    const yours = (n: ReturnType<typeof navFor>) => n.find((s) => s.section === 'My site')?.items.map((i) => i.label);
    expect(yours(withoutItem(nav, '/manage/marquee'))).toEqual(['About you', 'Contact information', 'Socials', 'QR code']);
    expect(withoutItem([{ section: 'X', items: [{ label: 'Only', href: '/only' }] }], '/only')).toEqual([]);
  });
});
