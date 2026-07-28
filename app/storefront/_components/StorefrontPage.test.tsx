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
vi.mock('@/lib/archetypes/registry', () => ({ archetypeSpec: () => ({ render: specRender }) }));
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

import StorefrontPage from './StorefrontPage';

const ENV = { archetypeKey: 'main-street', lookKey: 'ember', content: {} };

beforeEach(() => {
  loadHome.mockReset();
  loadDraft.mockReset();
  verify.mockReset();
  specRender.mockClear();
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
