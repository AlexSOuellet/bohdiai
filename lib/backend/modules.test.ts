import { describe, it, expect } from 'vitest';
import { navFor, BACKEND_MODULES, type BackendModule } from './modules';
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
  it('shows Products and Collections only when the catalog is on', () => {
    expect(navFor(BACKEND_MODULES, new Set(['catalog']))).toContainEqual({
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
  it('adds Market dates under Your site when switched on', () => {
    expect(navFor(BACKEND_MODULES, new Set(['profile', 'gallery', 'market_dates']))[1]?.items.map((i) => i.label)).toEqual(['About you', 'Gallery', 'Market dates']);
  });

  it('shows About you and Gallery under Your site, and no catalog', () => {
    expect(navFor(BACKEND_MODULES, new Set(['profile', 'gallery']))).toEqual([
      { section: 'Site', items: [{ label: 'Home', href: '/manage' }] },
      {
        section: 'Your site',
        items: [
          { label: 'About you', href: '/manage/profile' },
          { label: 'Gallery', href: '/manage/gallery' },
        ],
      },
    ]);
  });
});
