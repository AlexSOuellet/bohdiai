import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DesignTokens } from '@/lib/tokens';
import type { GeneratedPage } from './generate-page';

const rpcMock = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({ rpc: rpcMock }),
}));

import { writeStorefront } from './write-storefront';

const TOKENS: DesignTokens = {
  colors: {
    primary: '#000',
    accent: '#111',
    background: '#fff',
    surface: '#eee',
    text: '#000',
    textMuted: '#666',
    border: '#ccc',
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    headingWeight: 700,
    headingLetterSpacing: '0',
    bodyLineHeight: '1.6',
    baseSize: '16px',
  },
  wordmark: {
    font: 'Inter',
    treatment: 'solid',
    color1: '#000',
    color2: '',
    letterSpacing: '0',
  },
  shape: { borderRadius: 'md', cardBorderRadius: 'md' },
  spacing: { sectionPadding: 'normal', cardGap: 'normal' },
  layout: { heroStyle: 'full-bleed', productGridCols: 3, footerStyle: 'minimal' },
};

const PAGE: GeneratedPage = {
  blocks: [
    {
      blockKey: 'hero',
      position: 0,
      content: { headline: 'Hi' },
      slots: { 'cta': { widgetKey: 'cta-button', content: { label: 'Go' } } },
    },
    {
      blockKey: 'plain',
      position: 1,
      content: { foo: 'bar' },
      slots: {},
    },
  ],
  secondaryPages: {
    shop: { eyebrow: 'X', heading: 'Shop', subheading: 'sub' },
    contact: { heading: 'C', subheading: 's', buttonLabel: 'Send' },
    about: {
      eyebrow: 'X',
      headline: 'About',
      intro: 'i',
      body: 'b'.repeat(220),
      signatureName: 'Alex',
      signatureRole: '',
    },
  },
};

function input(overrides: Record<string, unknown> = {}) {
  return {
    subdomain: 'shop',
    shopName: 'Shop',
    nicheSlug: 'candles',
    moodKey: 'rustic',
    tenantTypes: ['seller'],
    tokens: TOKENS,
    pages: [{ slug: '/', pageType: 'home', title: 'Home', blocks: PAGE.blocks }],
    collections: [],
    listings: [],
    subscriptions: [],
    ...overrides,
  };
}

describe('writeStorefront (unit, mocked Supabase)', () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it('returns tenantId and subdomain on happy path', async () => {
    rpcMock.mockResolvedValue({ data: { tenantId: 't-1', subdomain: 'shop' }, error: null });
    const r = await writeStorefront(input());
    expect(r).toEqual({ tenantId: 't-1', subdomain: 'shop' });
  });

  it('flattens slots into block content when slots is non-empty', async () => {
    rpcMock.mockResolvedValue({ data: { tenantId: 't', subdomain: 'shop' }, error: null });
    await writeStorefront(input());
    const sentPages = (rpcMock.mock.calls[0]?.[1].p_data as { pages: Array<{ blocks: Array<{ content: Record<string, unknown> }> }> }).pages;
    expect(sentPages[0]?.blocks[0]?.content['slots']).toBeDefined();
    expect(sentPages[0]?.blocks[1]?.content['slots']).toBeUndefined();
  });

  it('throws when the RPC errors', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(writeStorefront(input())).rejects.toThrow('Failed to write storefront: boom');
  });

  it('throws when the RPC returns an unexpected shape', async () => {
    rpcMock.mockResolvedValue({ data: { foo: 'bar' }, error: null });
    await expect(writeStorefront(input())).rejects.toThrow('unexpected shape');
  });

  it('throws when data is null but no error', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    await expect(writeStorefront(input())).rejects.toThrow('unexpected shape');
  });

  it('throws when data is a non-object', async () => {
    rpcMock.mockResolvedValue({ data: 'oops', error: null });
    await expect(writeStorefront(input())).rejects.toThrow('unexpected shape');
  });

  it('passes empty string as logoUrl when undefined', async () => {
    rpcMock.mockResolvedValue({ data: { tenantId: 't', subdomain: 's' }, error: null });
    await writeStorefront(input());
    const p = rpcMock.mock.calls[0]?.[1].p_data as { logoUrl: string };
    expect(p.logoUrl).toBe('');
  });

  it('passes through provided logoUrl', async () => {
    rpcMock.mockResolvedValue({ data: { tenantId: 't', subdomain: 's' }, error: null });
    await writeStorefront(input({ logoUrl: 'https://logo' }));
    const p = rpcMock.mock.calls[0]?.[1].p_data as { logoUrl: string };
    expect(p.logoUrl).toBe('https://logo');
  });
});
