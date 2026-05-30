import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase admin BEFORE importing the module under test.
const singleMock = vi.fn();
const finalEqMock = vi.fn().mockResolvedValue({ data: null, error: null });

function makeSupabaseAdmin() {
  return {
    from: (table: string) => {
      if (table === 'niches') {
        return {
          select: () => ({
            eq: () => ({
              single: singleMock,
            }),
          }),
        };
      }
      if (table === 'design_choices') {
        return {
          update: () => ({
            is: () => ({
              eq: () => ({
                eq: finalEqMock,
              }),
            }),
          }),
        };
      }
      return {} as unknown;
    },
  };
}

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => makeSupabaseAdmin(),
}));

const writeStorefrontLayoutMock = vi.fn();
vi.mock('@/lib/generation/write-storefront-layout', () => ({
  writeStorefrontLayout: (args: unknown) => writeStorefrontLayoutMock(args),
}));

import {
  BOHDI_LAYOUT_TOOLS,
  handleSetStyleSheet,
  handleSetLayout,
  finalizeLayoutEngine,
} from './layout-tools';
import { emptyAccumulator } from './types';
import type { BohdiAccumulator, BohdiBrief } from './types';
import type { HandlerContext } from './tools';
import type { StyleSheet } from '@/lib/style-sheet';

const VALID_STYLE_SHEET: StyleSheet = {
  palette: [
    { name: 'Saddle', value: '#a0522d', character: 'Warm tanned leather.' },
    { name: 'Cream', value: '#f5f0e8', character: 'A soft cream wash.' },
    { name: 'Ink', value: '#1a1a1a', character: 'Deep night ink.' },
  ],
  fonts: [
    {
      name: 'Display',
      family: 'Cormorant',
      source: 'google',
      weights: [400, 700],
      fallback: 'serif',
      character: 'Confident display serif.',
    },
    {
      name: 'Body',
      family: 'Inter',
      source: 'google',
      weights: [400],
      fallback: 'sans-serif',
      character: 'Clean body workhorse.',
    },
  ],
  textures: [],
};

const VALID_PAGE_INPUT = {
  slug: 'home',
  name: 'Home',
  root: { type: 'text', role: 'body', content: 'hi' },
};

function makeBrief(over: Partial<BohdiBrief> = {}): BohdiBrief {
  return {
    shopName: 'Acme Candles',
    subdomain: 'acme',
    nicheSlug: 'candles',
    moodKey: 'rustic',
    productCount: 4,
    ...over,
  };
}

function makeCtx(accumulator: BohdiAccumulator, brief = makeBrief()): HandlerContext {
  return {
    brief,
    accumulator,
    done: { value: false, result: null },
    tenantIdRef: { value: null },
  };
}

describe('BOHDI_LAYOUT_TOOLS', () => {
  it('exports the two layout tools', () => {
    const names = BOHDI_LAYOUT_TOOLS.map((t) => t.name);
    expect(names).toContain('set_style_sheet');
    expect(names).toContain('set_layout');
  });
});

describe('handleSetStyleSheet', () => {
  it('stores style sheet on valid input and returns ok message', async () => {
    const a = emptyAccumulator();
    const r = await handleSetStyleSheet(VALID_STYLE_SHEET, a);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.message).toContain('Palette: 3');
      expect(r.message).toContain('Fonts: 2');
      expect(r.message).toContain('Textures: 0');
    }
    expect(a.styleSheet).not.toBeNull();
  });

  it('returns issues on invalid input', async () => {
    const a = emptyAccumulator();
    const r = await handleSetStyleSheet({ palette: [], fonts: [], textures: [] }, a);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.issues.length).toBeGreaterThan(0);
      expect(r.issues[0]?.path).toBeDefined();
      expect(r.issues[0]?.message).toBeDefined();
    }
    expect(a.styleSheet).toBeNull();
  });

  it('maps root-level path to (root)', async () => {
    const a = emptyAccumulator();
    // string at the top will produce zero-length path → "(root)" fallback
    const r = await handleSetStyleSheet('not an object', a);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.issues.some((i) => i.path === '(root)')).toBe(true);
    }
  });
});

describe('handleSetLayout', () => {
  it('stores a valid page', async () => {
    const a = emptyAccumulator();
    const r = await handleSetLayout(VALID_PAGE_INPUT, a);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.message).toContain('/home');
    expect(a.layoutPages.length).toBe(1);
    expect(a.layoutPages[0]?.slug).toBe('home');
  });

  it('replaces an existing page with the same slug', async () => {
    const a = emptyAccumulator();
    await handleSetLayout(VALID_PAGE_INPUT, a);
    const updated = {
      ...VALID_PAGE_INPUT,
      name: 'Home 2',
      root: { type: 'text', role: 'headline', content: 'fresh' },
    };
    const r = await handleSetLayout(updated, a);
    expect(r.ok).toBe(true);
    expect(a.layoutPages.length).toBe(1);
    expect(a.layoutPages[0]?.name).toBe('Home 2');
  });

  it('accepts optional meta', async () => {
    const a = emptyAccumulator();
    const r = await handleSetLayout(
      { ...VALID_PAGE_INPUT, meta: { title: 'T', description: 'D' } },
      a,
    );
    expect(r.ok).toBe(true);
    expect(a.layoutPages[0]?.meta?.title).toBe('T');
  });

  it('rejects when args is null', async () => {
    const a = emptyAccumulator();
    const r = await handleSetLayout(null, a);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues[0]?.path).toBe('(root)');
  });

  it('rejects when slug/name are missing', async () => {
    const a = emptyAccumulator();
    const r = await handleSetLayout({}, a);
    expect(r.ok).toBe(false);
  });

  it('returns validation issues from the page schema', async () => {
    const a = emptyAccumulator();
    const r = await handleSetLayout(
      { slug: 'Home', name: 'x', root: { type: 'text', role: 'body', content: 'x' } },
      a,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.length).toBeGreaterThan(0);
    expect(a.layoutPages.length).toBe(0);
  });
});

describe('finalizeLayoutEngine', () => {
  beforeEach(() => {
    writeStorefrontLayoutMock.mockReset();
    singleMock.mockReset();
    finalEqMock.mockClear();
  });

  it('throws if style sheet is not set', async () => {
    const a = emptyAccumulator();
    a.layoutPages = [{ slug: 'home', name: 'Home', root: { type: 'text', role: 'body', content: 'x' } }];
    await expect(finalizeLayoutEngine(makeCtx(a))).rejects.toThrow('style sheet not set');
  });

  it('throws if no layout pages are set', async () => {
    const a = emptyAccumulator();
    a.styleSheet = VALID_STYLE_SHEET;
    await expect(finalizeLayoutEngine(makeCtx(a))).rejects.toThrow('no layout pages set');
  });

  it('sanitizes pages, calls writeStorefrontLayout, sets done, backfills design_choices', async () => {
    const a = emptyAccumulator();
    a.styleSheet = VALID_STYLE_SHEET;
    a.layoutPages = [
      { slug: 'home', name: 'Home', root: { type: 'text', role: 'body', content: 'hi — there' } },
    ];
    singleMock.mockResolvedValue({ data: { tenant_type_fit: ['seller', 'subscription'] }, error: null });
    writeStorefrontLayoutMock.mockResolvedValue({ tenantId: 't-123', subdomain: 'acme' });

    const ctx = makeCtx(a, makeBrief({ logoUrl: 'https://x/y.png' }));
    const r = await finalizeLayoutEngine(ctx);

    expect(r).toEqual({ tenantId: 't-123', subdomain: 'acme' });
    expect(ctx.tenantIdRef.value).toBe('t-123');
    expect(ctx.done.value).toBe(true);
    expect(ctx.done.result).toEqual({ tenantId: 't-123', subdomain: 'acme' });
    expect(writeStorefrontLayoutMock).toHaveBeenCalledTimes(1);
    const call = writeStorefrontLayoutMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call['logoUrl']).toBe('https://x/y.png');
    expect(call['tenantTypes']).toEqual(['seller', 'subscription']);
    // sanitized: em-dash should have been replaced
    const pages = call['layoutPages'] as Array<{ root: { content: string } }>;
    expect(pages[0]?.root.content).not.toContain('—');
    expect(finalEqMock).toHaveBeenCalled();
  });

  it('omits logoUrl when not on brief and defaults tenantTypes when niche has none', async () => {
    const a = emptyAccumulator();
    a.styleSheet = VALID_STYLE_SHEET;
    a.layoutPages = [
      { slug: 'home', name: 'Home', root: { type: 'text', role: 'body', content: 'clean' } },
    ];
    singleMock.mockResolvedValue({ data: null, error: null });
    writeStorefrontLayoutMock.mockResolvedValue({ tenantId: 't-2', subdomain: 'acme' });

    await finalizeLayoutEngine(makeCtx(a));
    const call = writeStorefrontLayoutMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call['logoUrl']).toBeUndefined();
    expect(call['tenantTypes']).toEqual(['seller']);
  });
});
