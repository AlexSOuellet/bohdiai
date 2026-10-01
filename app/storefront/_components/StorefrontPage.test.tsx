import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// The two assertions that matter for the draft-preview branch:
//   token verifies to THIS tenant  → loadDraftEnvelope supplies the envelope
//   token absent / for another tenant → loadHomeEnvelope supplies it
// We mock the surrounding world just enough that renderStore completes without
// touching a real DB or renderer, and assert which loader was consulted.

const loadHome = vi.fn();
const loadDraft = vi.fn();
const verify = vi.fn();
const specRender = vi.fn(() => null);

vi.mock('@/lib/storefront/load-envelope', () => ({
  loadHomeEnvelope: (id: string) => loadHome(id),
  loadDraftEnvelope: (id: string) => loadDraft(id),
  loadTenantChrome: () => Promise.resolve({ logoUrl: undefined, brandColors: [] }),
}));
vi.mock('@/lib/editor/preview-token', () => ({ verifyPreviewToken: (t: string) => verify(t) }));
// Whether the mocked archetype shows the shop's catalog (Main Street does, the contractor page doesn't).
let specUsesCatalog = true;
vi.mock('@/lib/archetypes/registry', () => ({ archetypeSpec: () => ({ render: specRender, usesCatalog: specUsesCatalog }) }));
vi.mock('next/headers', () => ({ headers: () => Promise.resolve(new Map([['x-tenant-id', 't1']])) }));
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('notFound'); } }));

// supabaseAdmin() chain: every query resolves to { data: [] } (no listings/collections).
function supa() {
  const chain: Record<string, unknown> = {};
  for (const m of ['from', 'select', 'eq', 'is', 'order']) chain[m] = vi.fn(() => chain);
  chain['then'] = (resolve: (v: unknown) => void) => resolve({ data: [] });
  return chain;
}
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => supa() }));

// The shared catalog projection: an empty shop unless a test says otherwise.
const loadCatalog = vi.fn();
const loadCollections = vi.fn();
vi.mock('@/lib/storefront/catalog', () => ({
  loadCatalog: (...a: unknown[]) => loadCatalog(...a),
  loadCollections: (...a: unknown[]) => loadCollections(...a),
}));

import StorefrontPage, { tenantUsesCatalog } from './StorefrontPage';

const ENV = { archetypeKey: 'main-street', lookKey: 'ember', content: {} };

beforeEach(() => {
  loadHome.mockReset();
  loadDraft.mockReset();
  verify.mockReset();
  specRender.mockClear();
  specUsesCatalog = true;
  loadCatalog.mockReset();
  loadCollections.mockReset();
  loadCatalog.mockResolvedValue({ products: [], byId: new Map() });
  loadCollections.mockResolvedValue([]);
});

describe('StorefrontPage draft preview', () => {
  it('renders the draft when the token matches the tenant', async () => {
    verify.mockReturnValue('t1');
    loadDraft.mockResolvedValue({ ...ENV, lookKey: 'draft-look' });
    await StorefrontPage({ slug: '/', previewToken: 'ok' });
    expect(loadDraft).toHaveBeenCalledWith('t1');
    expect(loadHome).not.toHaveBeenCalled();
    // The draft envelope is what reached the renderer.
    expect(specRender).toHaveBeenCalledWith(expect.objectContaining({ lookKey: 'draft-look' }));
  });

  it('renders published when the token is for another tenant', async () => {
    verify.mockReturnValue('other');
    loadHome.mockResolvedValue({ ...ENV, lookKey: 'live-look' });
    await StorefrontPage({ slug: '/', previewToken: 'ok' });
    expect(loadDraft).not.toHaveBeenCalled();
    expect(loadHome).toHaveBeenCalledWith('t1');
    expect(specRender).toHaveBeenCalledWith(expect.objectContaining({ lookKey: 'live-look' }));
  });

  it('renders published when there is no token (public visitor)', async () => {
    loadHome.mockResolvedValue({ ...ENV, lookKey: 'live-look' });
    await StorefrontPage({ slug: '/' });
    expect(verify).not.toHaveBeenCalled();
    expect(loadDraft).not.toHaveBeenCalled();
    expect(loadHome).toHaveBeenCalledWith('t1');
  });

  it('falls back to published when the token matches but no draft exists', async () => {
    verify.mockReturnValue('t1');
    loadDraft.mockResolvedValue(null);
    loadHome.mockResolvedValue({ ...ENV, lookKey: 'live-look' });
    await StorefrontPage({ slug: '/', previewToken: 'ok' });
    expect(loadDraft).toHaveBeenCalledWith('t1');
    expect(loadHome).toHaveBeenCalledWith('t1');
    expect(specRender).toHaveBeenCalledWith(expect.objectContaining({ lookKey: 'live-look' }));
  });
});

describe('StorefrontPage preview-nav forwarder', () => {
  it('renders the preview-nav forwarder when a preview token is present', async () => {
    verify.mockReturnValue('t1');
    loadDraft.mockResolvedValue({ ...ENV });
    const out = await StorefrontPage({ slug: '/', previewToken: 'ok' });
    const html = renderToStaticMarkup(out as ReactElement);
    expect(html).toContain('data-preview-nav');
  });

  it('does not render the forwarder on a public render (no token)', async () => {
    loadHome.mockResolvedValue({ ...ENV });
    const out = await StorefrontPage({ slug: '/' });
    const html = renderToStaticMarkup(out as ReactElement);
    expect(html).not.toContain('data-preview-nav');
  });
});

describe('StorefrontPage still-reveal (editor preview)', () => {
  it('emits the reveal-resolving override when previewStill is set', async () => {
    loadHome.mockResolvedValue({ ...ENV });
    const out = await StorefrontPage({ slug: '/', previewStill: true });
    const html = renderToStaticMarkup(out as ReactElement);
    expect(html).toContain('.ms-module-item{opacity:1');
    expect(html).toContain('.ms-const-card{opacity:1');
    expect(html).toContain('.ms-reveal{opacity:1');
  });

  it('does not emit the override on a normal (public) render', async () => {
    loadHome.mockResolvedValue({ ...ENV });
    const out = await StorefrontPage({ slug: '/' });
    const html = renderToStaticMarkup(out as ReactElement);
    expect(html).not.toContain('.ms-module-item{opacity:1');
  });
});

describe('collections', () => {
  const product = (slug: string) => ({ slug, name: slug, price: '$10', description: '', status: 'active' as const, media: [], variations: [] });
  const fig = product('fig');
  const pine = product('pine');
  const autumn = { slug: 'autumn', name: 'Autumn', count: 1, cover: undefined };

  beforeEach(() => {
    loadHome.mockResolvedValue({ ...ENV });
    loadCatalog.mockResolvedValue({ products: [fig, pine], byId: new Map([['l1', fig], ['l2', pine]]) });
    loadCollections.mockResolvedValue([{ id: 'c1', slug: 'autumn', view: autumn, products: [pine] }]);
  });

  it('passes only that collection’s products, in its order, to the collection page', async () => {
    await StorefrontPage({ slug: '/collections/autumn' });
    expect(loadCollections).toHaveBeenCalledWith(expect.anything(), 't1', { products: [fig, pine], byId: expect.any(Map) });
    expect(specRender).toHaveBeenCalledWith(
      expect.objectContaining({ page: 'collection', collectionSlug: 'autumn', products: [pine], collections: [autumn] }),
    );
  });

  it('gives the home every live product and the live collections band', async () => {
    await StorefrontPage({ slug: '/' });
    expect(specRender).toHaveBeenCalledWith(expect.objectContaining({ products: [fig, pine], collections: [autumn] }));
  });

  it('404s for a collection that is not live', async () => {
    await expect(StorefrontPage({ slug: '/collections/winter' })).rejects.toThrow('notFound');
    expect(specRender).not.toHaveBeenCalled();
  });
});

describe('archetypes without a catalog', () => {
  beforeEach(() => {
    specUsesCatalog = false;
    loadHome.mockResolvedValue({ archetypeKey: 'contractor', lookKey: 'contractor', content: {} });
  });

  it('never reads the catalog, so a catalog outage cannot take the page down', async () => {
    loadCatalog.mockRejectedValue(new Error('Could not load products'));
    loadCollections.mockRejectedValue(new Error('Could not load collections'));
    await StorefrontPage({ slug: '/' });
    expect(loadCatalog).not.toHaveBeenCalled();
    expect(loadCollections).not.toHaveBeenCalled();
    expect(specRender).toHaveBeenCalledWith(expect.objectContaining({ products: [], collections: [] }));
  });
});

describe('archetypes with a catalog', () => {
  it('reads the catalog and collections', async () => {
    loadHome.mockResolvedValue({ ...ENV });
    await StorefrontPage({ slug: '/' });
    expect(loadCatalog).toHaveBeenCalledWith(expect.anything(), 't1');
    expect(loadCollections).toHaveBeenCalled();
  });
});

describe('tenantUsesCatalog', () => {
  it('follows the published archetype', async () => {
    loadHome.mockResolvedValue({ ...ENV });
    expect(await tenantUsesCatalog('t1')).toBe(true);
    specUsesCatalog = false;
    expect(await tenantUsesCatalog('t1')).toBe(false);
    expect(loadHome).toHaveBeenCalledWith('t1');
  });
  it('is false with no published home or no archetype key', async () => {
    loadHome.mockResolvedValue(null);
    expect(await tenantUsesCatalog('t1')).toBe(false);
    loadHome.mockResolvedValue({ lookKey: 'ember' });
    expect(await tenantUsesCatalog('t1')).toBe(false);
  });
});
