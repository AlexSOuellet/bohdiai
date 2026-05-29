// Dispatcher for storefront generation. Routes to Bohdi for niches with a
// hand-curated style sheet; falls back to the legacy one-shot pipeline for
// the rest. Both paths accept an optional progress emitter so the SSE route
// can stream maker-facing status to the build screen.

import { supabaseAdmin } from '@/lib/supabase';
import { MOODS, type MoodKey } from '@/lib/moods';
import { generateTokens } from '@/lib/generation/generate-tokens';
import { generatePage } from '@/lib/generation/generate-page';
import { generateListings } from '@/lib/generation/generate-listings';
import { generateCollections } from '@/lib/generation/generate-collections';
import { generateSubscriptions } from '@/lib/generation/generate-subscriptions';
import { writeStorefront, type GeneratedSubscriptionWithImage } from '@/lib/generation/write-storefront';
import { generateHeroImage, generateProductImage, generateAboutImage } from '@/lib/fal';
import { BLOCKS_MANIFEST } from '@/lib/blocks-manifest.generated';
import { labelFor, type ProgressEmitter } from '@/lib/progress';
import { inferGenderFromName } from '@/lib/name-gender';
import { sanitizeDeep } from '@/lib/copy-sanitize';
import { runBohdi } from '@/lib/bohdi/run';

const BOHDI_NICHES = new Set(['leatherworker', 'photo_magnet_maker']);

export interface RunStorefrontInput {
  shopName: string;
  subdomain: string;
  nicheSlug: string;
  moodKey: MoodKey;
  productCount: number;
  makerName?: string | undefined;
  logoUrl?: string | undefined;
  brandColors?: string[] | undefined;
  voiceBoothPitch?: string | undefined;
  voiceNegativeSpace?: string | undefined;
}

export interface RunStorefrontResult {
  tenantId: string;
  subdomain: string;
}

export async function runStorefront(
  input: RunStorefrontInput,
  onProgress?: ProgressEmitter,
): Promise<RunStorefrontResult> {
  if (BOHDI_NICHES.has(input.nicheSlug)) {
    return runBohdi(
      {
        shopName: input.shopName,
        subdomain: input.subdomain,
        nicheSlug: input.nicheSlug,
        moodKey: input.moodKey,
        productCount: input.productCount,
        makerName: input.makerName,
        logoUrl: input.logoUrl,
        brandColors: input.brandColors,
        voiceBoothPitch: input.voiceBoothPitch,
        voiceNegativeSpace: input.voiceNegativeSpace,
      },
      onProgress,
    );
  }
  return runLegacy(input, onProgress);
}

async function runLegacy(
  input: RunStorefrontInput,
  onProgress?: ProgressEmitter,
): Promise<RunStorefrontResult> {
  const emit = (step: Parameters<typeof labelFor>[0]) => {
    if (onProgress) onProgress({ type: 'status', step, label: labelFor(step, input.makerName) });
  };
  emit('starting');

  const mood = MOODS[input.moodKey];

  const { data: niche, error: nicheError } = await supabaseAdmin()
    .from('niches')
    .select('display_name, body_markdown, tenant_type_fit')
    .eq('slug', input.nicheSlug)
    .single();

  if (nicheError || !niche) {
    throw new Error(`Niche not found: ${input.nicheSlug}`);
  }

  const moodSignal = {
    nicheSlug: input.nicheSlug,
    moodKey: mood.key,
    moodLabel: mood.label,
    moodDescription: mood.description,
    gender: inferGenderFromName(input.makerName),
  };

  emit('choosing-palette');
  emit('composing-home');
  const [tokens, page, collections, subscriptionsRaw] = await Promise.all([
    generateTokens(niche.body_markdown, mood, undefined, input.nicheSlug, input.brandColors),
    generatePage(input.shopName, niche.display_name, niche.body_markdown, mood, undefined, input.nicheSlug),
    generateCollections(input.shopName, niche.display_name, niche.body_markdown, undefined, input.nicheSlug, mood.key),
    generateSubscriptions(input.shopName, niche.display_name, niche.body_markdown, undefined, input.nicheSlug, mood.key),
  ]);

  emit('generating-product-image');
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

  emit('generating-hero-image');
  const [heroImageUrl, aboutImageUrl] = await Promise.all([
    generateHeroImage(niche.display_name, input.subdomain, moodSignal),
    generateAboutImage(niche.display_name, input.subdomain, moodSignal),
  ]);

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
  const heroManifest = BLOCKS_MANIFEST.find((m) => m.key === heroBlock.blockKey);
  const imageField = heroManifest?.contentSchema.find((f) => f.type === 'image' && !f.aiGenerated);
  const imageFieldKey = imageField?.key ?? 'backgroundImageUrl';
  heroBlock.content[imageFieldKey] = heroImageUrl;

  const aboutBlock = page.blocks.find((b) => b.blockKey === 'about-maker');
  if (aboutBlock !== undefined && aboutImageUrl !== null) {
    aboutBlock.content['imageUrl'] = aboutImageUrl;
  }

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

  emit('finalizing');
  return writeStorefront({
    subdomain: input.subdomain,
    shopName: input.shopName,
    nicheSlug: input.nicheSlug,
    moodKey: input.moodKey,
    tenantTypes: niche.tenant_type_fit,
    tokens,
    // Scrub AI-tell punctuation from all text fields before writing. Same
    // floor Bohdi gets at finalize — the model's prompt can't be trusted to
    // avoid em-dashes and semicolons on its own.
    pages: sanitizeDeep(pages),
    collections: sanitizeDeep(collections),
    listings: sanitizeDeep(listings),
    subscriptions: sanitizeDeep(subscriptions),
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
