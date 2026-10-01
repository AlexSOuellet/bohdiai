import { describe, it, expect, vi, beforeEach } from 'vitest';

const { loadProduct, renderArchetypeProductPage, tenantUsesCatalog, tenantProductJsonLd, notFound } = vi.hoisted(() => ({
  loadProduct: vi.fn(),
  renderArchetypeProductPage: vi.fn(),
  tenantUsesCatalog: vi.fn(),
  tenantProductJsonLd: vi.fn(() => ({})),
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));
vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-tenant-id': 't1' }) }));
vi.mock('next/navigation', () => ({ notFound }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({}) }));
vi.mock('@/lib/storefront/catalog', () => ({ loadProduct }));
vi.mock('../../_components/StorefrontPage', () => ({ renderArchetypeProductPage, tenantUsesCatalog }));
vi.mock('@/lib/storefront/metadata', () => ({ storefrontMetadata: vi.fn((m: unknown) => m), storefrontSeoFacts: async () => ({ shop: 'facts' }) }));
vi.mock('@/lib/storefront/seo', () => ({ tenantProductJsonLd }));

import StorefrontListingPage, { generateMetadata } from './page';

const view = { slug: 'fig', name: 'Fig Candle', price: '$24', description: 'Long', status: 'sold_out', media: [{ kind: 'image', url: 'https://x/1.webp', alt: 'Fig' }], variations: [] };
const props = { params: Promise.resolve({ slug: 'fig' }) };

beforeEach(() => {
  vi.clearAllMocks();
  renderArchetypeProductPage.mockResolvedValue('PAGE');
  tenantUsesCatalog.mockResolvedValue(true);
});

describe('product page', () => {
  it('renders the shop’s product and marks it out of stock for search engines when sold out', async () => {
    loadProduct.mockResolvedValue({ view, isPreview: false, priceCents: 2400 });
    await StorefrontListingPage(props);
    expect(loadProduct).toHaveBeenCalledWith({}, 't1', 'fig');
    expect(renderArchetypeProductPage).toHaveBeenCalledWith('t1', view);
    expect(tenantProductJsonLd).toHaveBeenCalledWith({ shop: 'facts' }, expect.objectContaining({ priceCents: 2400, inStock: false, imageUrl: 'https://x/1.webp' }));
  });
  it('is in stock for a live, buyable product but not for a placeholder', async () => {
    loadProduct.mockResolvedValue({ view: { ...view, status: 'active' }, isPreview: false, priceCents: 2400 });
    await StorefrontListingPage(props);
    expect(tenantProductJsonLd).toHaveBeenLastCalledWith({ shop: 'facts' }, expect.objectContaining({ inStock: true }));
    loadProduct.mockResolvedValue({ view: { ...view, status: 'active' }, isPreview: true, priceCents: 2400 });
    await StorefrontListingPage(props);
    expect(tenantProductJsonLd).toHaveBeenLastCalledWith({ shop: 'facts' }, expect.objectContaining({ inStock: false }));
  });
  it('404s for a product that isn’t live', async () => {
    loadProduct.mockResolvedValue(null);
    await expect(StorefrontListingPage(props)).rejects.toThrow('NOT_FOUND');
  });
  it('shares the real photo', async () => {
    loadProduct.mockResolvedValue({ view, isPreview: false, priceCents: 2400 });
    expect(await generateMetadata(props)).toMatchObject({ pageName: 'Fig Candle', imageUrl: 'https://x/1.webp' });
  });
});

describe('a shop whose page has no catalog (the contractor page)', () => {
  it('404s without reading the catalog', async () => {
    tenantUsesCatalog.mockResolvedValue(false);
    await expect(StorefrontListingPage(props)).rejects.toThrow('NOT_FOUND');
    expect(tenantUsesCatalog).toHaveBeenCalledWith('t1');
    expect(loadProduct).not.toHaveBeenCalled();
    expect(renderArchetypeProductPage).not.toHaveBeenCalled();
  });
  it('has no metadata and never reads the catalog for it', async () => {
    tenantUsesCatalog.mockResolvedValue(false);
    expect(await generateMetadata(props)).toEqual({});
    expect(loadProduct).not.toHaveBeenCalled();
  });
});
