'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkGenerationRateLimit } from '@/lib/rate-limit';
import { MOODS, type MoodKey } from '@/lib/moods';
import { generateTokens } from '@/lib/generation/generate-tokens';
import { generatePage } from '@/lib/generation/generate-page';
import { generateListings } from '@/lib/generation/generate-listings';
import { writeStorefront } from '@/lib/generation/write-storefront';
import { generateHeroImage } from '@/lib/fal';
import { toSubdomain } from './_components/types';

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
    input.shopName,
    niche.display_name,
    mood.label,
    input.subdomain,
  );

  // Inject hero image URL into the hero block content before writing to DB.
  // The hero block is always at position 0; backgroundImageUrl is system-filled, not AI-filled.
  if (heroImageUrl !== null) {
    const heroBlock = page.blocks.find((b) => b.position === 0);
    if (heroBlock !== undefined) {
      heroBlock.content['backgroundImageUrl'] = heroImageUrl;
    }
  }

  return writeStorefront({
    subdomain: input.subdomain,
    shopName: input.shopName,
    nicheSlug: input.nicheSlug,
    tenantTypes: niche.tenant_type_fit,
    tokens,
    page,
    listings,
  });
}
