import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Page } from '@/lib/layout';
import type { StyleSheet } from '@/lib/style-sheet';

const rpcMock = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({ rpc: rpcMock }),
}));

import { writeStorefrontLayout } from './write-storefront-layout';

const STYLE_SHEET: StyleSheet = {
  name: 'test',
  palette: [],
  fonts: [],
  textures: [],
} as unknown as StyleSheet;

function makePage(slug: string, opts?: { title?: string; description?: string }): Page {
  return {
    slug,
    name: `Name ${slug}`,
    root: { type: 'section', id: 'r', children: [] } as unknown as Page['root'],
    ...(opts ? { meta: opts } : {}),
  } as Page;
}

function baseInput(pages: Page[]) {
  return {
    subdomain: 'shop',
    shopName: 'Shop',
    nicheSlug: 'candles',
    moodKey: 'rustic',
    tenantTypes: ['seller'],
    styleSheet: STYLE_SHEET,
    layoutPages: pages,
    collections: [],
    listings: [],
    subscriptions: [],
  };
}

describe('writeStorefrontLayout', () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it('writes via the RPC and returns the parsed result', async () => {
    rpcMock.mockResolvedValue({
      data: { tenantId: 't-1', subdomain: 'shop' },
      error: null,
    });
    const r = await writeStorefrontLayout(
      baseInput([
        makePage('home', { title: 'Home Title', description: 'Home desc' }),
        makePage('about'),
        makePage('shop'),
        makePage('contact'),
        makePage('lookbook'),
      ]),
    );
    expect(r).toEqual({ tenantId: 't-1', subdomain: 'shop' });
    expect(rpcMock).toHaveBeenCalledWith(
      'write_tenant_storefront_layout',
      expect.objectContaining({ p_data: expect.any(Object) }),
    );
    const sentPages = (
      rpcMock.mock.calls[0]?.[1].p_data as { pages: Array<Record<string, unknown>> }
    ).pages;
    expect(sentPages[0]?.['slug']).toBe('/');
    expect(sentPages[0]?.['pageType']).toBe('home');
    expect(sentPages[0]?.['title']).toBe('Home Title');
    expect(sentPages[0]?.['metaDescription']).toBe('Home desc');
    expect(sentPages[1]?.['pageType']).toBe('about');
    expect(sentPages[2]?.['pageType']).toBe('shop');
    expect(sentPages[3]?.['pageType']).toBe('contact');
    expect(sentPages[4]?.['pageType']).toBe('custom');
    // page without meta falls back to name and nulls description
    expect(sentPages[1]?.['title']).toBe('Name about');
    expect(sentPages[1]?.['metaDescription']).toBeNull();
  });

  it('strips leading slashes from non-home slugs', async () => {
    rpcMock.mockResolvedValue({ data: { tenantId: 't', subdomain: 'shop' }, error: null });
    await writeStorefrontLayout(baseInput([makePage('///about')]));
    const sentPages = (rpcMock.mock.calls[0]?.[1].p_data as { pages: Array<{ slug: string }> })
      .pages;
    expect(sentPages[0]?.slug).toBe('/about');
  });

  it('handles /-slug variations for pageType', async () => {
    rpcMock.mockResolvedValue({ data: { tenantId: 't', subdomain: 'shop' }, error: null });
    await writeStorefrontLayout(
      baseInput([makePage('/'), makePage('/about'), makePage('/shop'), makePage('/contact')]),
    );
    const sentPages = (rpcMock.mock.calls[0]?.[1].p_data as { pages: Array<{ pageType: string }> })
      .pages;
    expect(sentPages.map((p) => p.pageType)).toEqual(['home', 'about', 'shop', 'contact']);
  });

  it('throws when the RPC returns an error', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'db boom' } });
    await expect(writeStorefrontLayout(baseInput([makePage('home')]))).rejects.toThrow(
      'Failed to write storefront (layout): db boom',
    );
  });

  it('throws when the RPC returns an unexpected shape', async () => {
    rpcMock.mockResolvedValue({ data: { wrong: 'shape' }, error: null });
    await expect(writeStorefrontLayout(baseInput([makePage('home')]))).rejects.toThrow(
      'unexpected shape',
    );
  });

  it('throws when data is null but no error', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    await expect(writeStorefrontLayout(baseInput([makePage('home')]))).rejects.toThrow(
      'unexpected shape',
    );
  });

  it('passes empty string as logoUrl when undefined', async () => {
    rpcMock.mockResolvedValue({ data: { tenantId: 't', subdomain: 'shop' }, error: null });
    await writeStorefrontLayout(baseInput([makePage('home')]));
    const sent = rpcMock.mock.calls[0]?.[1].p_data as { logoUrl: string };
    expect(sent.logoUrl).toBe('');
  });

  it('passes through provided logoUrl', async () => {
    rpcMock.mockResolvedValue({ data: { tenantId: 't', subdomain: 'shop' }, error: null });
    await writeStorefrontLayout({
      ...baseInput([makePage('home')]),
      logoUrl: 'https://x/logo.png',
    });
    const sent = rpcMock.mock.calls[0]?.[1].p_data as { logoUrl: string };
    expect(sent.logoUrl).toBe('https://x/logo.png');
  });

  it('treats empty-string slug as home', async () => {
    rpcMock.mockResolvedValue({ data: { tenantId: 't', subdomain: 's' }, error: null });
    // empty-string slug would fail PageSchema; bypass by casting
    const page = {
      slug: '',
      name: 'Home',
      root: { type: 'section', id: 'r', children: [] },
    } as unknown as Page;
    await writeStorefrontLayout(baseInput([page]));
    const sent = rpcMock.mock.calls[0]?.[1].p_data as {
      pages: Array<{ slug: string; pageType: string }>;
    };
    expect(sent.pages[0]?.slug).toBe('/');
    expect(sent.pages[0]?.pageType).toBe('home');
  });
});
