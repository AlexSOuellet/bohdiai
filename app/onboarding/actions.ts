'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkGenerationRateLimit } from '@/lib/rate-limit';
import { type MoodKey } from '@/lib/moods';
import { toSubdomain } from '@/lib/subdomain';
import { logger } from '@/lib/logger';
import { runStorefront } from '@/lib/onboarding/run-storefront';
import type { VisionPerPhoto } from './_components/types';

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

// ─── Storefront generation (non-streaming server action) ─────────────────────
//
// The streaming path lives at /api/onboarding/generate and is what the build
// screen uses. This server action remains as a non-streaming fallback in case
// the client cannot use SSE.

export interface GenerateStorefrontInput {
  shopName: string;
  subdomain: string;
  nicheSlug: string;
  moodKey: MoodKey;
  productCount: number;
  makerName?: string;
  logoUrl?: string;
  brandColors?: string[];
  productPhotoUrls?: string[];
  visionPerPhoto?: VisionPerPhoto[];
  makerWork?: string;
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
    return await runStorefront(input);
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
