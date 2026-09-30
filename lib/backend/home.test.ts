import { describe, it, expect } from 'vitest';
import { collectHome, type HomeContributor } from './home';
import type { FeatureKey } from './features';

const contributors: HomeContributor[] = [
  { feature: 'catalog', load: async () => ({ tiles: [{ label: 'Products', value: '5' }], attention: ['2 products have no photo'] }) },
  { feature: 'video', load: async () => ({ tiles: [{ label: 'Videos', value: '1' }], attention: [] }) },
  { feature: null, load: async () => ({ tiles: [], attention: ['Your domain isn’t reaching your site'] }) },
];

describe('collectHome', () => {
  it('gathers tiles and attention from switched-on and always-on contributors', async () => {
    const home = await collectHome(contributors, new Set<FeatureKey>(['catalog']), 't1');
    expect(home.tiles.map((t) => t.label)).toEqual(['Products']);
    expect(home.attention).toEqual(['2 products have no photo', 'Your domain isn’t reaching your site']);
  });
  it('turns a failing contributor into a visible notice instead of breaking the page', async () => {
    const broken: HomeContributor[] = [{ feature: null, load: async () => { throw new Error('db down'); } }];
    const home = await collectHome(broken, new Set(), 't1');
    expect(home.attention).toEqual(['Part of this page couldn’t load. Refresh to try again.']);
  });
});
