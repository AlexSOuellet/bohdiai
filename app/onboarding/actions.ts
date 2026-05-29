'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkGenerationRateLimit } from '@/lib/rate-limit';
import { MOODS, type MoodKey } from '@/lib/moods';
import { generateTokens } from '@/lib/generation/generate-tokens';
import { generatePage } from '@/lib/generation/generate-page';
import { generateListings } from '@/lib/generation/generate-listings';
import { generateCollections } from '@/lib/generation/generate-collections';
import { generateSubscriptions } from '@/lib/generation/generate-subscriptions';
import { writeStorefront, type GeneratedSubscriptionWithImage } from '@/lib/generation/write-storefront';
import { generateHeroImage, generateProductImage, generateAboutImage } from '@/lib/fal';
import { BLOCKS_MANIFEST } from '@/lib/blocks-manifest.generated';
import { toSubdomain } from '@/lib/subdomain';
import { logger } from '@/lib/logger';
import { runBohdi } from '@/lib/bohdi/run';

// ─── Subdomain availability check ────────────────────────────────────────────

export interface SubdomainCheckResult {
  subdomain: string;
  available: boolean;
}

export async function checkSubdomainAvailable(shopName: string): Promise<SubdomainCheckResult> {
  const subdomain = toSubdomain(shopName);
  if (subdomain.length < 2) return { subdomain, available: false };

  const { data, error } = await supabaseAdmin()
    .from('tenants')
    .select('id')
    .eq('subdomain', subdomain)
    .maybeSingle();

  if (error) throw new Error('Subdomain check failed');

  return { subdomain, available: data === null };
}

// ─── Storefront generation ────────────────────────────────────────────────────

export interface GenerateStorefrontInput {
  shopName: string;
  subdomain: string;
  nicheSlug: string;
  moodKey: MoodKey;
  productCount: number; // 0 = none, 3 = just a few, 8 = solid collection, 15 = full catalog
  logoUrl?: string;
  brandColors?: string[];
}

export interface GenerateStorefrontResult {
  tenantId: string;
  subdomain: string;
}

export async function generateStorefront(
  input: GenerateStorefrontInput,
): Promise<GenerateStorefrontResult> {
  await checkGenerationRateLimit();
  try {
    return await runGeneration(input);
  } catch (err) {
    logger.error('storefront generation failed', {
      subdomain: input.subdomain,
      nicheSlug: input.nicheSlug,
      moodKey: input.moodKey,
      error: err instanceof Error ? err.message : String(err),
    });
    throw new Error('We were unable to build your store. Please try again.');
  }
}

async function runGeneration(input: GenerateStorefrontInput): Promise<GenerateStorefrontResult> {
  const mood = MOODS[input.moodKey];

  // Gated: niches with a hand-curated style sheet route through Bohdi.
  // Other niches use the legacy one-shot pipeline until their style sheets land.
  const BOHDI_NICHES = new Set(['leatherworker', 'photo_magnet_maker']);
  if (BOHDI_NICHES.has(input.nicheSlug)) {
    const result = await runBohdi({
      shopName: input.shopName,
      subdomain: input.subdomain,
      nicheSlug: input.nicheSlug,
      moodKey: input.moodKey,
      productCount: input.productCount,
      logoUrl: input.logoUrl,
      brandColors: input.brandColors,
    });
    return { tenantId: result.tenantId, subdomain: result.subdomain };
  }

  const { data: niche, error: nicheError } = await supabaseAdmin()
    .from('niches')
    .select('display_name, body_markdown, tenant_type_fit')
    .eq('slug', input.nicheSlug)
    .single();

  if (nicheError || !niche) {
    throw new Error(`Niche not found: ${input.nicheSlug}`);
  }

  // Run independent AI text generation calls in parallel first. Collections must
  // complete before listings (the AI needs the collection slugs to assign each
  // product to one), so listings is awaited separately after this batch.
  // Subscriptions are independent and run in the initial batch.
  const moodSignal = {
    nicheSlug: input.nicheSlug,
    moodKey: mood.key,
    moodLabel: mood.label,
    moodDescription: mood.description,
  };

  const [tokens, page, collections, subscriptionsRaw] = await Promise.all([
    generateTokens(niche.body_markdown, mood, undefined, input.nicheSlug, input.brandColors),
    generatePage(input.shopName, niche.display_name, niche.body_markdown, mood, undefined, input.nicheSlug),
    generateCollections(input.shopName, niche.display_name, niche.body_markdown, undefined, input.nicheSlug, mood.key),
    generateSubscriptions(input.shopName, niche.display_name, niche.body_markdown, undefined, input.nicheSlug, mood.key),
  ]);

  // Generate images for the sample subscriptions. Batched 2 at a time to stay
  // under fal.ai concurrent-request limits (same pattern as generateListings).
  const subscriptions: GeneratedSubscriptionWithImage[] = [];
  for (let i = 0; i < subscriptionsRaw.length; i += 2) {
    const batch = subscriptionsRaw.slice(i, i + 2);
    const results = await Promise.all(
      batch.map((s) =>
        generateProductImage(
          s.name,
          s.description,
          niche.display_name,
          input.subdomain,
          `subscriptions/${s.slug}`,
          moodSignal,
        ).then((image_url) => ({ ...s, image_url })),
      ),
    );
    subscriptions.push(...results);
  }

  const listings =
    input.productCount > 0
      ? await generateListings(
          input.shopName,
          input.subdomain,
          niche.display_name,
          niche.body_markdown,
          input.productCount,
          collections.map((c) => c.slug),
          undefined,
          moodSignal,
        )
      : [];

  // Generate hero + about images after text generation. Product images already
  // generated inside generateListings; subscription images generated above.
  // Running hero and about together stays under fal.ai concurrent-request limits.
  const [heroImageUrl, aboutImageUrl] = await Promise.all([
    generateHeroImage(niche.display_name, input.subdomain, moodSignal),
    generateAboutImage(niche.display_name, input.subdomain, moodSignal),
  ]);

  // Inject hero image URL into the hero block content before writing to DB.
  if (heroImageUrl === null) {
    throw new Error('Hero image generation failed — storefront cannot be created without a hero image.');
  }
  const heroBlock = page.blocks.find((b) => {
    const manifest = BLOCKS_MANIFEST.find((m) => m.key === b.blockKey);
    return manifest?.sectionType === 'hero';
  });
  if (heroBlock === undefined) {
    throw new Error('No hero block found in generated page — generation response was malformed.');
  }
  // Look up the image field key from the block's schema — different hero variants use different field names.
  const heroManifest = BLOCKS_MANIFEST.find((m) => m.key === heroBlock.blockKey);
  const imageField = heroManifest?.contentSchema.find((f) => f.type === 'image' && !f.aiGenerated);
  const imageFieldKey = imageField?.key ?? 'backgroundImageUrl';
  heroBlock.content[imageFieldKey] = heroImageUrl;

  // Inject about image if the AI picked the about-maker block. Image is optional —
  // null result just means the block renders without a photo (graceful fallback).
  const aboutBlock = page.blocks.find((b) => b.blockKey === 'about-maker');
  if (aboutBlock !== undefined && aboutImageUrl !== null) {
    aboutBlock.content['imageUrl'] = aboutImageUrl;
  }

  // Strip nav + footer blocks the AI may have generated — we inject our own.
  // Also strip collections-row when no collections were generated for this
  // tenant (the AI runs in parallel with generateCollections, so it may have
  // chosen the block speculatively; we drop it if there's nothing real to show).
  const hasCollections = collections.length > 0;
  const aiHomeBlocks = page.blocks.filter((b) => {
    const manifest = BLOCKS_MANIFEST.find((m) => m.key === b.blockKey);
    if (manifest?.sectionType === 'nav' || manifest?.sectionType === 'footer') return false;
    if (b.blockKey === 'collections-row' && !hasCollections) return false;
    return true;
  });

  const homeSectionTypes = aiHomeBlocks.map((b) => {
    const manifest = BLOCKS_MANIFEST.find((m) => m.key === b.blockKey);
    return manifest?.sectionType;
  });

  // Order rule (hard): shop first, conditional items in the middle,
  // about second-to-last, contact last. shop, about, contact are baseline
  // — always present in both nav and footer.
  const hasSubscriptions = subscriptions.length > 0;

  const conditionals: string[] = [];
  if (hasCollections) conditionals.push('collections');
  if (hasSubscriptions) conditionals.push('subscriptions');
  if (homeSectionTypes.includes('events')) conditionals.push('events');

  const navSections: string[] = ['shop', ...conditionals, 'about', 'contact'];
  const footerSections: string[] = ['shop', ...conditionals, 'about', 'contact'];

  const navBlock = buildNavBlock(input.shopName, navSections, input.logoUrl ?? '');
  const footerBlock = buildFooterBlock(input.shopName, footerSections);

  const homePageBlocks = [
    navBlock,
    ...aiHomeBlocks.map((b, i) => ({ ...b, position: i })),
    footerBlock,
  ];

  // ─── Secondary pages ────────────────────────────────────────────────────────

  const shopIntro = page.secondaryPages.shop;
  const shopPageBlocks = [
    navBlock,
    {
      blockKey: 'page-intro',
      position: 0,
      content: {
        eyebrow: shopIntro.eyebrow,
        heading: shopIntro.heading,
        subheading: shopIntro.subheading,
      },
      slots: {} as Record<string, { widgetKey: string; content: Record<string, string> }>,
    },
    {
      blockKey: 'products-shop-grid',
      position: 1,
      content: {},
      slots: {} as Record<string, { widgetKey: string; content: Record<string, string> }>,
    },
    footerBlock,
  ];

  const contactCopy = page.secondaryPages.contact;
  const contactPageBlocks = [
    navBlock,
    {
      blockKey: 'contact-form',
      position: 0,
      content: {
        heading: contactCopy.heading,
        subheading: contactCopy.subheading,
        buttonLabel: contactCopy.buttonLabel,
      },
      slots: {} as Record<string, { widgetKey: string; content: Record<string, string> }>,
    },
    footerBlock,
  ];

  const aboutCopy = page.secondaryPages.about;
  const aboutPageBlocks = [
    navBlock,
    {
      blockKey: 'about-story',
      position: 0,
      content: {
        eyebrow: aboutCopy.eyebrow,
        headline: aboutCopy.headline,
        intro: aboutCopy.intro,
        body: aboutCopy.body,
        signatureName: aboutCopy.signatureName,
        signatureRole: aboutCopy.signatureRole,
        imageUrl: aboutImageUrl ?? '',
      },
      slots: {} as Record<string, { widgetKey: string; content: Record<string, string> }>,
    },
    footerBlock,
  ];

  const pages: Array<{
    slug: string;
    pageType: string;
    title: string;
    blocks: typeof homePageBlocks;
  }> = [
    { slug: '/', pageType: 'home', title: input.shopName, blocks: homePageBlocks },
    { slug: '/shop', pageType: 'shop', title: `${input.shopName} — Shop`, blocks: shopPageBlocks },
    { slug: '/about', pageType: 'about', title: `${input.shopName} — About`, blocks: aboutPageBlocks },
    { slug: '/contact', pageType: 'contact', title: `${input.shopName} — Contact`, blocks: contactPageBlocks },
  ];

  return writeStorefront({
    subdomain: input.subdomain,
    shopName: input.shopName,
    nicheSlug: input.nicheSlug,
    moodKey: input.moodKey,
    tenantTypes: niche.tenant_type_fit,
    tokens,
    pages,
    collections,
    listings,
    subscriptions,
    logoUrl: input.logoUrl,
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type SystemBlock = {
  blockKey: string;
  position: number;
  content: Record<string, string>;
  slots: Record<string, { widgetKey: string; content: Record<string, string> }>;
};

function buildNavBlock(shopName: string, sections: string[], logoUrl: string): SystemBlock {
  return {
    blockKey: 'nav-split',
    position: -1,
    content: { shopName, sections: JSON.stringify(sections), logoUrl },
    slots: {},
  };
}

function buildFooterBlock(shopName: string, sections: string[]): SystemBlock {
  return {
    blockKey: 'footer-classic',
    position: 9999,
    content: { shopName, sections: JSON.stringify(sections) },
    slots: {},
  };
}

