'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkGenerationRateLimit } from '@/lib/rate-limit';
import { MOODS, type MoodKey } from '@/lib/moods';
import { generateTokens } from '@/lib/generation/generate-tokens';
import { generatePage } from '@/lib/generation/generate-page';
import { generateListings } from '@/lib/generation/generate-listings';
import { writeStorefront } from '@/lib/generation/write-storefront';
import { generateHeroImage } from '@/lib/fal';
import { BLOCKS_MANIFEST } from '@/lib/blocks-manifest.generated';
import { toSubdomain } from '@/lib/subdomain';
import { logger } from '@/lib/logger';

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

  const { data: niche, error: nicheError } = await supabaseAdmin()
    .from('niches')
    .select('display_name, body_markdown, tenant_type_fit')
    .eq('slug', input.nicheSlug)
    .single();

  if (nicheError || !niche) {
    throw new Error(`Niche not found: ${input.nicheSlug}`);
  }

  // Run all AI text generation calls in parallel first
  const [tokens, page, listings] = await Promise.all([
    generateTokens(niche.body_markdown, mood),
    generatePage(input.shopName, niche.display_name, niche.body_markdown, mood),
    input.productCount > 0
      ? generateListings(
          input.shopName,
          input.subdomain,
          niche.display_name,
          niche.body_markdown,
          input.productCount,
        )
      : Promise.resolve([]),
  ]);

  // Generate hero image after text generation — product images already generated inside
  // generateListings. Running hero separately avoids fal.ai concurrent request rate limits.
  const heroImageUrl = await generateHeroImage(
    niche.display_name,
    input.subdomain,
  );

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

  // Inject nav block as a system block — always present, not left to the AI.
  // Strip any nav block the AI may have generated and replace with ours.
  const aiBlocks = page.blocks.filter((b) => {
    const manifest = BLOCKS_MANIFEST.find((m) => m.key === b.blockKey);
    return manifest?.sectionType !== 'nav';
  });
  // Determine nav links based on what sections are present in the page
  const sectionTypes = aiBlocks.map((b) => {
    const manifest = BLOCKS_MANIFEST.find((m) => m.key === b.blockKey);
    return manifest?.sectionType;
  });
  const navSections: string[] = ['shop'];
  if (sectionTypes.includes('about')) navSections.push('about');
  if (sectionTypes.includes('collections')) navSections.push('collections');
  if (sectionTypes.includes('events')) navSections.push('events');

  const navBlock = {
    blockKey: 'nav-split',
    position: -1,
    content: {
      shopName: input.shopName,
      sections: JSON.stringify(navSections),
    },
    slots: {} as Record<string, { widgetKey: string; content: Record<string, string> }>,
  };

  page.blocks = [navBlock, ...aiBlocks.map((b, i) => ({ ...b, position: i }))];

  return writeStorefront({
    subdomain: input.subdomain,
    shopName: input.shopName,
    nicheSlug: input.nicheSlug,
    moodKey: input.moodKey,
    tenantTypes: niche.tenant_type_fit,
    tokens,
    page,
    listings,
  });
}
