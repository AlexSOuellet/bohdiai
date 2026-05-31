import { describe, it, expect, afterEach } from 'vitest';
import { writeStorefront } from './write-storefront';
import { supabaseAdmin } from '@/lib/supabase';
import type { DesignTokens } from '@/lib/tokens';
import type { GeneratedPage } from './generate-page';

// Skip in CI — CI uses dummy Supabase credentials that cannot reach a real DB.
// Run locally where .env.local has real credentials.
const describeIfReal = process.env['CI'] === 'true' ? describe.skip : describe;

const SAMPLE_TOKENS: DesignTokens = {
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

const SAMPLE_PAGE: GeneratedPage = {
  blocks: [
    {
      blockKey: 'hero-cinematic',
      position: 0,
      content: {
        headline: 'Test headline',
        subheadline: 'Test subheadline',
        backgroundImageUrl: 'https://example.com/image.jpg',
      },
      slots: {
        'primary-cta': {
          widgetKey: 'cta-button',
          content: { label: 'Shop Now', href: '#products' },
        },
      },
    },
  ],
  secondaryPages: {
    shop: { eyebrow: 'The Shop', heading: 'All work', subheading: 'Browse the studio.' },
    contact: { heading: 'Say Hello', subheading: 'Drop us a note.', buttonLabel: 'Send Message' },
    about: {
      eyebrow: 'Our Story',
      headline: 'About the Studio',
      intro: 'A short intro paragraph that sets up the story.',
      body: 'Paragraph one of the long body text for testing purposes.\n\nParagraph two of the long body text to make sure multi-paragraph rendering works correctly.',
      signatureName: 'Test',
      signatureRole: 'Maker',
    },
  },
};

const SAMPLE_PAGES = [{ slug: '/', pageType: 'home', title: 'Home', blocks: SAMPLE_PAGE.blocks }];

describeIfReal('writeStorefront (integration)', () => {
  const cleanupIds: string[] = [];

  afterEach(async () => {
    const db = supabaseAdmin();
    for (const tenantId of cleanupIds) {
      await db.from('listings').delete().eq('tenant_id', tenantId);
      await db.from('page_blocks').delete().eq('tenant_id', tenantId);
      await db.from('content_pages').delete().eq('tenant_id', tenantId);
      await db.from('design_tokens').delete().eq('tenant_id', tenantId);
      await db.from('tenants').delete().eq('id', tenantId);
    }
    cleanupIds.length = 0;
  });

  it('creates tenant, tokens, page, and blocks in one operation', async () => {
    const subdomain = `test-write-${Date.now()}`;
    const db = supabaseAdmin();

    const result = await writeStorefront({
      subdomain,
      shopName: 'Test Candle Co',
      nicheSlug: 'candles',
      moodKey: 'rustic',
      tenantTypes: ['seller'],
      tokens: SAMPLE_TOKENS,
      pages: SAMPLE_PAGES,
      collections: [],
      subscriptions: [],
      listings: [],
    });

    cleanupIds.push(result.tenantId);

    const { data: tenant } = await db
      .from('tenants')
      .select('id, subdomain, tier, types, primary_niche, mood_key')
      .eq('id', result.tenantId)
      .single();

    expect(tenant?.subdomain).toBe(subdomain);
    expect(tenant?.tier).toBe('basic');
    expect(tenant?.types).toContain('seller');
    expect(tenant?.primary_niche).toBe('candles');
    expect(tenant?.mood_key).toBe('rustic');

    const { data: tokens } = await db
      .from('design_tokens')
      .select('is_active, source')
      .eq('tenant_id', result.tenantId)
      .single();

    expect(tokens?.is_active).toBe(true);
    expect(tokens?.source).toBe('onboarding');

    const { data: page } = await db
      .from('content_pages')
      .select('slug, status, page_type')
      .eq('tenant_id', result.tenantId)
      .eq('slug', '/')
      .single();

    expect(page?.slug).toBe('/');
    expect(page?.status).toBe('published');
    expect(page?.page_type).toBe('home');

    const { data: blocks } = await db
      .from('page_blocks')
      .select('block_key, position')
      .eq('tenant_id', result.tenantId)
      .order('position');

    expect(blocks?.length).toBe(1);
    expect(blocks?.[0]?.block_key).toBe('hero-cinematic');
  });

  it('creates listings when provided', async () => {
    const subdomain = `test-listings-${Date.now()}`;
    const db = supabaseAdmin();

    const result = await writeStorefront({
      subdomain,
      shopName: 'Test Candle Co',
      nicheSlug: 'candles',
      moodKey: 'rustic',
      tenantTypes: ['seller'],
      tokens: SAMPLE_TOKENS,
      pages: SAMPLE_PAGES,
      collections: [],
      subscriptions: [],
      listings: [
        {
          name: 'Black Fig Candle',
          slug: 'black-fig-candle',
          short_description: 'A deep earthy candle.',
          description: 'Hand-poured soy wax.',
          base_price_cents: 2400,
          image_prompt: 'candle on slate',
          image_url: null,
          collection_slug: null,
        },
      ],
    });

    cleanupIds.push(result.tenantId);

    const { data: listings } = await db
      .from('listings')
      .select('name, slug, base_price_cents, status')
      .eq('tenant_id', result.tenantId);

    expect(listings?.length).toBe(1);
    expect(listings?.[0]?.slug).toBe('black-fig-candle');
    expect(listings?.[0]?.base_price_cents).toBe(2400);
    expect(listings?.[0]?.status).toBe('active');
  });

  it('rolls back everything if the subdomain is already taken', async () => {
    const subdomain = `test-rollback-${Date.now()}`;
    const db = supabaseAdmin();

    const first = await writeStorefront({
      subdomain,
      shopName: 'First Shop',
      nicheSlug: 'candles',
      moodKey: 'rustic',
      tenantTypes: ['seller'],
      tokens: SAMPLE_TOKENS,
      pages: SAMPLE_PAGES,
      collections: [],
      subscriptions: [],
      listings: [],
    });
    cleanupIds.push(first.tenantId);

    // Duplicate subdomain — the RPC should fail and roll back completely.
    await expect(
      writeStorefront({
        subdomain,
        shopName: 'Second Shop',
        nicheSlug: 'candles',
        moodKey: 'rustic',
        tenantTypes: ['seller'],
        tokens: SAMPLE_TOKENS,
        pages: SAMPLE_PAGES,
        collections: [],
        subscriptions: [],
        listings: [],
      }),
    ).rejects.toThrow();

    // Only one tenant with this subdomain should exist.
    const { data: tenants } = await db.from('tenants').select('id').eq('subdomain', subdomain);

    expect(tenants?.length).toBe(1);
  });
});
