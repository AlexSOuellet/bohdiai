import { describe, it, expect } from 'vitest';
import { navFor, type BackendModule } from './modules';
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
