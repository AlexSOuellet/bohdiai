import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks (must be declared BEFORE importing the SUT) ───────────────────────

const nicheSingleMock = vi.fn();
const designChoicesInsertMock = vi.fn();
const designChoicesUpdateMock = vi.fn().mockResolvedValue({ data: null, error: null });

function makeSupabaseAdmin() {
  return {
    from: (table: string) => {
      if (table === 'niches') {
        return {
          select: () => ({ eq: () => ({ single: nicheSingleMock }) }),
        };
      }
      if (table === 'design_choices') {
        return {
          insert: (row: unknown) => ({
            select: () => ({
              single: () => designChoicesInsertMock(row),
            }),
          }),
          update: () => ({
            is: () => ({
              eq: () => ({ eq: designChoicesUpdateMock }),
            }),
          }),
        };
      }
      return {};
    },
  };
}

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => makeSupabaseAdmin(),
}));

const generateHeroImageMock = vi.fn();
const generateAboutImageMock = vi.fn();
const generateProductImageMock = vi.fn();
vi.mock('@/lib/fal', () => ({
  generateHeroImage: (...args: unknown[]) => generateHeroImageMock(...args),
  generateAboutImage: (...args: unknown[]) => generateAboutImageMock(...args),
  generateProductImage: (...args: unknown[]) => generateProductImageMock(...args),
}));

const writeStorefrontMock = vi.fn();
vi.mock('@/lib/generation/write-storefront', () => ({
  writeStorefront: (input: unknown) => writeStorefrontMock(input),
}));

// ─── Imports under test ──────────────────────────────────────────────────────

import { BOHDI_TOOLS, dispatchTool, type HandlerContext } from './tools';
import { emptyAccumulator } from './types';
import type { BohdiAccumulator, BohdiBrief } from './types';
import { BLOCKS_MANIFEST } from '@/lib/blocks-manifest.generated';
import { WIDGETS_MANIFEST } from '@/lib/widgets-manifest.generated';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const VALID_TOKENS = {
  colors: {
    primary: '#2c6e49',
    accent: '#8ecae6',
    background: '#f5f0e8',
    surface: '#ffffff',
    text: '#1a1a1a',
    textMuted: '#6b6b6b',
    border: '#e0dbd2',
  },
  typography: {
    headingFont: 'Playfair Display',
    bodyFont: 'Inter',
    headingWeight: 700,
    headingLetterSpacing: '-0.02em',
    bodyLineHeight: '1.6',
    baseSize: '16px',
  },
  wordmark: {
    font: 'Bodoni Moda',
    treatment: 'solid',
    color1: '#1a1a1a',
    color2: '',
    letterSpacing: '-0.03em',
  },
  shape: { borderRadius: 'md', cardBorderRadius: 'lg' },
  spacing: { sectionPadding: 'normal', cardGap: 'normal' },
  layout: { heroStyle: 'full-bleed', productGridCols: 3, footerStyle: 'minimal' },
};

function makeBrief(over: Partial<BohdiBrief> = {}): BohdiBrief {
  return {
    shopName: 'Acme',
    subdomain: 'acme',
    nicheSlug: 'leatherworker',
    moodKey: 'rustic',
    productCount: 2,
    ...over,
  };
}

function makeCtx(over: Partial<HandlerContext> = {}): HandlerContext {
  return {
    brief: makeBrief(),
    accumulator: emptyAccumulator(),
    done: { value: false, result: null },
    tenantIdRef: { value: null },
    ...over,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('BOHDI_TOOLS', () => {
  it('contains all expected tool names', () => {
    const names = BOHDI_TOOLS.map((t) => t.name);
    for (const expected of [
      'read_niche',
      'read_mood',
      'list_blocks',
      'list_widgets',
      'log_decision',
      'generate_image',
      'set_tokens',
      'set_home_page',
      'set_secondary_pages_copy',
      'add_collection',
      'add_listing',
      'add_subscription',
      'set_hero_image',
      'set_about_image',
      'set_about_page',
      'finalize',
    ]) {
      expect(names).toContain(expected);
    }
  });
});

describe('toolsForNiche', () => {
  it('returns the full tool set for every niche', async () => {
    const { toolsForNiche } = await import('./tools');
    const names = toolsForNiche('leatherworker').map((t) => t.name);
    for (const expected of [
      'list_blocks',
      'list_widgets',
      'set_tokens',
      'set_home_page',
      'set_secondary_pages_copy',
      'set_about_page',
      'set_hero_image',
      'set_about_image',
      'finalize',
      'read_niche',
    ]) {
      expect(names).toContain(expected);
    }
    // The layout-engine tools are gone — no niche sees them anymore.
    expect(names).not.toContain('set_style_sheet');
    expect(names).not.toContain('set_layout');
    expect(names).not.toContain('generate_moment_asset');
  });
});

describe('dispatchTool — unknown tool', () => {
  it('throws', async () => {
    await expect(dispatchTool('does-not-exist', {}, makeCtx())).rejects.toThrow('Unknown tool');
  });
});

describe('read_niche', () => {
  beforeEach(() => nicheSingleMock.mockReset());

  it('returns niche data from supabase', async () => {
    nicheSingleMock.mockResolvedValue({
      data: { display_name: 'Leather', body_markdown: '# body', tenant_type_fit: ['seller'] },
      error: null,
    });
    const r = (await dispatchTool('read_niche', { slug: 'leatherworker' }, makeCtx())) as Record<
      string,
      unknown
    >;
    expect(r['slug']).toBe('leatherworker');
    expect(r['displayName']).toBe('Leather');
    expect(r['bodyMarkdown']).toBe('# body');
    // styleSheet may be null (file may not exist in test env)
    expect('styleSheet' in r).toBe(true);
  });

  it('throws when niche is missing', async () => {
    nicheSingleMock.mockResolvedValue({ data: null, error: { message: 'no row' } });
    await expect(dispatchTool('read_niche', { slug: 'nope' }, makeCtx())).rejects.toThrow(
      'Niche not found',
    );
  });
});

describe('read_mood', () => {
  it('returns mood metadata', async () => {
    const r = (await dispatchTool('read_mood', { key: 'rustic' }, makeCtx())) as Record<
      string,
      unknown
    >;
    expect(r['key']).toBe('rustic');
    expect(r['label']).toBeDefined();
  });

  it('returns the structured design direction rails', async () => {
    const r = (await dispatchTool('read_mood', { key: 'rustic' }, makeCtx())) as Record<
      string,
      unknown
    >;
    const dir = r['designDirection'] as Record<string, unknown> | undefined;
    expect(dir).toBeDefined();
    expect(dir?.['paletteTemperature']).toBeDefined();
    expect(dir?.['brightness']).toBeDefined();
    expect(dir?.['defaultScheme']).toBeDefined();
  });

  it('throws on unknown mood', async () => {
    await expect(dispatchTool('read_mood', { key: 'unknown' }, makeCtx())).rejects.toThrow(
      'Mood not found',
    );
  });
});

describe('list_blocks', () => {
  it('returns active blocks for a page type, excluding nav/footer/events-list', async () => {
    const r = (await dispatchTool('list_blocks', { pageType: 'home' }, makeCtx())) as Array<{
      key: string;
      sectionType: string;
    }>;
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((b) => b.sectionType !== 'nav' && b.sectionType !== 'footer')).toBe(true);
    expect(r.every((b) => b.key !== 'events-list')).toBe(true);
  });
});

describe('list_widgets', () => {
  it('returns active widgets', async () => {
    const r = (await dispatchTool('list_widgets', {}, makeCtx())) as Array<{ key: string }>;
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(WIDGETS_MANIFEST.filter((w) => w.status === 'active').length);
  });
});

describe('log_decision', () => {
  beforeEach(() => designChoicesInsertMock.mockReset());

  it('inserts a row and returns the id', async () => {
    designChoicesInsertMock.mockResolvedValue({ data: { id: 'd-1' }, error: null });
    const r = (await dispatchTool(
      'log_decision',
      {
        decisionType: 'palette',
        candidates: [{ a: 1 }, { a: 2 }],
        picked: { a: 1 },
        reasoning: 'because',
      },
      makeCtx(),
    )) as { id: string | null };
    expect(r.id).toBe('d-1');
  });

  it('throws when insert errors', async () => {
    designChoicesInsertMock.mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(
      dispatchTool(
        'log_decision',
        {
          decisionType: 'x',
          candidates: [{}, {}],
          picked: {},
          reasoning: 'r',
        },
        makeCtx(),
      ),
    ).rejects.toThrow('log_decision failed: boom');
  });

  it('returns null id when insert returns no data', async () => {
    designChoicesInsertMock.mockResolvedValue({ data: null, error: null });
    const r = (await dispatchTool(
      'log_decision',
      {
        decisionType: 'x',
        candidates: [{}, {}],
        picked: {},
        reasoning: 'r',
      },
      makeCtx(),
    )) as { id: string | null };
    expect(r.id).toBeNull();
  });
});

describe('generate_image', () => {
  beforeEach(() => {
    generateHeroImageMock.mockReset();
    generateAboutImageMock.mockReset();
    generateProductImageMock.mockReset();
  });

  it('hero kind calls generateHeroImage and emits progress', async () => {
    generateHeroImageMock.mockResolvedValue('https://x/hero.png');
    const events: unknown[] = [];
    const ctx = makeCtx({ onProgress: (e) => events.push(e) });
    const r = (await dispatchTool('generate_image', { kind: 'hero', prompt: 'p' }, ctx)) as {
      url: string;
    };
    expect(r.url).toBe('https://x/hero.png');
    expect(events.length).toBe(1);
  });

  it('about kind calls generateAboutImage', async () => {
    generateAboutImageMock.mockResolvedValue('https://x/about.png');
    const r = (await dispatchTool('generate_image', { kind: 'about', prompt: 'p' }, makeCtx())) as {
      url: string;
    };
    expect(r.url).toBe('https://x/about.png');
  });

  it('product kind requires slug and calls generateProductImage', async () => {
    generateProductImageMock.mockResolvedValue('https://x/p.png');
    const r = (await dispatchTool(
      'generate_image',
      { kind: 'product', prompt: 'p', slug: 'wax' },
      makeCtx(),
    )) as { url: string };
    expect(r.url).toBe('https://x/p.png');
    expect(generateProductImageMock).toHaveBeenCalled();
  });

  it('subscription kind uses subscriptions/ folder', async () => {
    generateProductImageMock.mockResolvedValue('https://x/s.png');
    await dispatchTool(
      'generate_image',
      { kind: 'subscription', prompt: 'p', slug: 'box' },
      makeCtx(),
    );
    const args = generateProductImageMock.mock.calls[0];
    expect(args?.[4]).toBe('subscriptions/box');
  });

  it('throws when product/subscription kind has no slug', async () => {
    await expect(
      dispatchTool('generate_image', { kind: 'product', prompt: 'p' }, makeCtx()),
    ).rejects.toThrow('requires slug');
  });

  it('throws when the image generator returns null', async () => {
    generateHeroImageMock.mockResolvedValue(null);
    await expect(
      dispatchTool('generate_image', { kind: 'hero', prompt: 'p' }, makeCtx()),
    ).rejects.toThrow('returned no URL');
  });
});

describe('set_tokens', () => {
  it('stores tokens on the accumulator', async () => {
    const ctx = makeCtx();
    const r = (await dispatchTool('set_tokens', VALID_TOKENS, ctx)) as { ok: boolean };
    expect(r.ok).toBe(true);
    expect(ctx.accumulator.tokens).not.toBeNull();
  });
});

describe('set_home_page', () => {
  it('stores blocks with default empty slots', async () => {
    const ctx = makeCtx();
    await dispatchTool(
      'set_home_page',
      {
        blocks: [{ blockKey: 'hero-cinematic', position: 0, content: {} }],
      },
      ctx,
    );
    expect(ctx.accumulator.homePage?.length).toBe(1);
    expect(ctx.accumulator.homePage?.[0]?.slots).toEqual({});
  });

  it('preserves provided slots', async () => {
    const ctx = makeCtx();
    await dispatchTool(
      'set_home_page',
      {
        blocks: [
          {
            blockKey: 'x',
            position: 0,
            content: {},
            slots: { a: { widgetKey: 'w', content: {} } },
          },
        ],
      },
      ctx,
    );
    expect(ctx.accumulator.homePage?.[0]?.slots?.['a']).toBeDefined();
  });
});

describe('set_secondary_pages_copy + add_collection + add_listing + add_subscription + image setters + about page', () => {
  it('stores secondary pages copy', async () => {
    const ctx = makeCtx();
    await dispatchTool(
      'set_secondary_pages_copy',
      {
        shop: { eyebrow: 'e', heading: 'h', subheading: 's' },
        contact: { heading: 'h', subheading: 's', buttonLabel: 'b' },
      },
      ctx,
    );
    expect(ctx.accumulator.shopPageCopy?.heading).toBe('h');
    expect(ctx.accumulator.contactPageCopy?.buttonLabel).toBe('b');
  });

  it('add_collection appends', async () => {
    const ctx = makeCtx();
    const r = (await dispatchTool(
      'add_collection',
      { name: 'n', slug: 's', description: 'd' },
      ctx,
    )) as { count: number };
    expect(r.count).toBe(1);
    expect(ctx.accumulator.collections.length).toBe(1);
  });

  it('add_listing appends and zeroes image_prompt', async () => {
    const ctx = makeCtx();
    await dispatchTool(
      'add_listing',
      {
        name: 'n',
        slug: 's',
        short_description: 'sd',
        description: 'd',
        base_price_cents: 1000,
        image_url: 'u',
        collection_slug: null,
      },
      ctx,
    );
    expect(ctx.accumulator.listings[0]?.image_prompt).toBe('');
  });

  it('add_subscription appends', async () => {
    const ctx = makeCtx();
    await dispatchTool(
      'add_subscription',
      {
        name: 'n',
        slug: 's',
        short_description: 'sd',
        description: 'd',
        base_price_cents: 1000,
        subscription_interval: 'month',
        image_url: 'u',
      },
      ctx,
    );
    expect(ctx.accumulator.subscriptions.length).toBe(1);
  });

  it('set_hero_image sets url', async () => {
    const ctx = makeCtx();
    await dispatchTool('set_hero_image', { url: 'h' }, ctx);
    expect(ctx.accumulator.heroImageUrl).toBe('h');
  });

  it('set_about_image sets url', async () => {
    const ctx = makeCtx();
    await dispatchTool('set_about_image', { url: 'a' }, ctx);
    expect(ctx.accumulator.aboutImageUrl).toBe('a');
  });

  it('set_about_page stores content', async () => {
    const ctx = makeCtx();
    await dispatchTool(
      'set_about_page',
      {
        eyebrow: 'e',
        headline: 'h',
        intro: 'i',
        body: 'b',
        signatureName: 'n',
        signatureRole: 'r',
      },
      ctx,
    );
    expect(ctx.accumulator.aboutPageContent?.body).toBe('b');
  });
});

// ─── finalize router ─────────────────────────────────────────────────────────

describe('finalize — legacy route', () => {
  beforeEach(() => {
    writeStorefrontMock.mockReset();
    nicheSingleMock.mockReset();
    designChoicesUpdateMock.mockClear();
  });

  function primeLegacyAccumulator(
    ctx: HandlerContext,
    opts: {
      withAbout?: boolean;
      withCollections?: boolean;
      withSubscriptions?: boolean;
      withEventsBlock?: boolean;
    } = {},
  ): void {
    ctx.accumulator.tokens = VALID_TOKENS as unknown as BohdiAccumulator['tokens'];
    const blocks: NonNullable<BohdiAccumulator['homePage']> = [
      { blockKey: 'hero-cinematic', position: 0, content: {}, slots: {} },
    ];
    if (opts.withAbout) {
      blocks.push({ blockKey: 'about-maker', position: 1, content: {}, slots: {} });
    }
    if (opts.withEventsBlock) {
      const eventBlockKey = BLOCKS_MANIFEST.find((m) => m.sectionType === 'events')?.key;
      if (eventBlockKey) {
        blocks.push({ blockKey: eventBlockKey, position: 2, content: {}, slots: {} });
      }
    }
    ctx.accumulator.homePage = blocks;
    ctx.accumulator.shopPageCopy = { eyebrow: 'e', heading: 'h', subheading: 's' };
    ctx.accumulator.contactPageCopy = { heading: 'h', subheading: 's', buttonLabel: 'b' };
    ctx.accumulator.heroImageUrl = 'https://x/hero.png';
    ctx.accumulator.aboutPageContent = {
      eyebrow: 'e',
      headline: 'h',
      intro: 'i',
      body: 'b',
      signatureName: 'n',
      signatureRole: 'r',
    };
    if (opts.withCollections) {
      ctx.accumulator.collections = [{ name: 'C', slug: 'c', description: 'd' }];
    }
    if (opts.withSubscriptions) {
      ctx.accumulator.subscriptions = [
        {
          name: 'S',
          slug: 's',
          short_description: 'sd',
          description: 'd',
          base_price_cents: 100,
          subscription_interval: 'month',
          image_url: 'u',
          image_prompt: '',
        },
      ];
    }
  }

  it('writes via writeStorefront and sets done', async () => {
    nicheSingleMock.mockResolvedValue({ data: { tenant_type_fit: ['seller'] }, error: null });
    writeStorefrontMock.mockResolvedValue({ tenantId: 't-leg', subdomain: 'shop' });
    const ctx = makeCtx();
    primeLegacyAccumulator(ctx);

    const r = (await dispatchTool('finalize', {}, ctx)) as { tenantId: string };
    expect(r.tenantId).toBe('t-leg');
    expect(ctx.done.value).toBe(true);
    expect(writeStorefrontMock).toHaveBeenCalled();
  });

  it('handles about image and collections/subscriptions/events', async () => {
    nicheSingleMock.mockResolvedValue({ data: null, error: null });
    writeStorefrontMock.mockResolvedValue({ tenantId: 't-3', subdomain: 'shop' });
    const ctx = makeCtx();
    primeLegacyAccumulator(ctx, {
      withAbout: true,
      withCollections: true,
      withSubscriptions: true,
      withEventsBlock: true,
    });
    ctx.accumulator.aboutImageUrl = 'https://x/about.png';

    await dispatchTool('finalize', {}, ctx);
    const input = writeStorefrontMock.mock.calls[0]?.[0] as {
      tenantTypes: string[];
      pages: Array<{ blocks: Array<{ blockKey: string; content: Record<string, string> }> }>;
    };
    expect(input.tenantTypes).toEqual(['seller']);
    const homeBlocks = input.pages[0]?.blocks ?? [];
    const navBlock = homeBlocks.find((b) => b.blockKey === 'nav-centered-wordmark');
    expect(navBlock).toBeDefined();
    // nav sections JSON should include collections + subscriptions + events
    const sections = JSON.parse(navBlock?.content['sections'] ?? '[]') as string[];
    expect(sections).toContain('collections');
    expect(sections).toContain('subscriptions');
    expect(sections).toContain('events');
  });

  it('throws when tokens missing', async () => {
    const ctx = makeCtx();
    await expect(dispatchTool('finalize', {}, ctx)).rejects.toThrow('tokens not set');
  });

  it('throws when home page missing', async () => {
    const ctx = makeCtx();
    ctx.accumulator.tokens = VALID_TOKENS as unknown as BohdiAccumulator['tokens'];
    await expect(dispatchTool('finalize', {}, ctx)).rejects.toThrow('home page not set');
  });

  it('throws when secondary copy missing', async () => {
    const ctx = makeCtx();
    ctx.accumulator.tokens = VALID_TOKENS as unknown as BohdiAccumulator['tokens'];
    ctx.accumulator.homePage = [
      { blockKey: 'hero-cinematic', position: 0, content: {}, slots: {} },
    ];
    await expect(dispatchTool('finalize', {}, ctx)).rejects.toThrow('secondary pages copy not set');
  });

  it('throws when hero image missing', async () => {
    const ctx = makeCtx();
    ctx.accumulator.tokens = VALID_TOKENS as unknown as BohdiAccumulator['tokens'];
    ctx.accumulator.homePage = [
      { blockKey: 'hero-cinematic', position: 0, content: {}, slots: {} },
    ];
    ctx.accumulator.shopPageCopy = { eyebrow: 'e', heading: 'h', subheading: 's' };
    ctx.accumulator.contactPageCopy = { heading: 'h', subheading: 's', buttonLabel: 'b' };
    await expect(dispatchTool('finalize', {}, ctx)).rejects.toThrow('hero image not set');
  });

  it('throws when no hero block in home page', async () => {
    nicheSingleMock.mockResolvedValue({ data: null, error: null });
    const ctx = makeCtx();
    ctx.accumulator.tokens = VALID_TOKENS as unknown as BohdiAccumulator['tokens'];
    // Use about-maker (sectionType "about") — no hero in the page.
    ctx.accumulator.homePage = [{ blockKey: 'about-maker', position: 0, content: {}, slots: {} }];
    ctx.accumulator.shopPageCopy = { eyebrow: 'e', heading: 'h', subheading: 's' };
    ctx.accumulator.contactPageCopy = { heading: 'h', subheading: 's', buttonLabel: 'b' };
    ctx.accumulator.heroImageUrl = 'https://x/h.png';
    ctx.accumulator.aboutPageContent = {
      eyebrow: 'e',
      headline: 'h',
      intro: 'i',
      body: 'b',
      signatureName: 'n',
      signatureRole: 'r',
    };
    await expect(dispatchTool('finalize', {}, ctx)).rejects.toThrow('no hero block');
  });

  it('throws when about page content missing', async () => {
    nicheSingleMock.mockResolvedValue({ data: null, error: null });
    const ctx = makeCtx();
    ctx.accumulator.tokens = VALID_TOKENS as unknown as BohdiAccumulator['tokens'];
    ctx.accumulator.homePage = [
      { blockKey: 'hero-cinematic', position: 0, content: {}, slots: {} },
    ];
    ctx.accumulator.shopPageCopy = { eyebrow: 'e', heading: 'h', subheading: 's' };
    ctx.accumulator.contactPageCopy = { heading: 'h', subheading: 's', buttonLabel: 'b' };
    ctx.accumulator.heroImageUrl = 'https://x/h.png';
    // aboutPageContent intentionally null
    await expect(dispatchTool('finalize', {}, ctx)).rejects.toThrow('about page content not set');
  });
});
