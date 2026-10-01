import { describe, it, expect, vi } from 'vitest';

const { listProducts, listCollections } = vi.hoisted(() => ({ listProducts: vi.fn(), listCollections: vi.fn() }));
vi.mock('./queries', () => ({ listProducts, listCollections }));
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: async () => ({}) }));

import { catalogHomeData, catalogHome } from './home';
import type { ProductRowView } from './queries';

const p = (status: ProductRowView['status'], over: Partial<ProductRowView> = {}): ProductRowView => ({
  id: status,
  name: status,
  status,
  priceLabel: '$1',
  stockLabel: '',
  soldOut: false,
  photoUrl: 'u',
  photoUploadId: 'x',
  collectionIds: [],
  ...over,
});

describe('catalogHomeData', () => {
  it('counts live and draft, leaving archived out', () => {
    const home = catalogHomeData([p('active'), p('active'), p('draft'), p('archived')], [{ id: 'c', name: 'C', status: 'active', productCount: 1 }]);
    expect(home.tiles).toEqual([
      { label: 'Products', value: '2', note: '1 draft' },
      { label: 'Collections', value: '1', note: '0 drafts' },
    ]);
  });
  it('lists what needs attention, in plain words', () => {
    const home = catalogHomeData(
      [p('active', { photoUrl: null }), p('draft', { photoUrl: null }), p('active', { soldOut: true }), p('archived', { photoUrl: null, soldOut: true })],
      [],
    );
    expect(home.attention).toEqual(['2 products have no photo.', '1 product is still a draft.', '1 live product is sold out.']);
  });
  it('is quiet when nothing needs attention', () => {
    expect(catalogHomeData([p('active')], []).attention).toEqual([]);
  });
});

describe('catalogHome', () => {
  it('is the catalog feature’s contributor', async () => {
    listProducts.mockResolvedValue([p('active')]);
    listCollections.mockResolvedValue([]);
    expect(catalogHome.feature).toBe('catalog');
    expect((await catalogHome.load('t1')).tiles[0]).toEqual({ label: 'Products', value: '1', note: '0 drafts' });
  });
});
