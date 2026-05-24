'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { MOODS, type MoodKey } from '@/lib/moods';
import { generateTokens } from '@/lib/generation/generate-tokens';
import { generatePage } from '@/lib/generation/generate-page';
import { writeStorefront } from '@/lib/generation/write-storefront';
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
}

export interface GenerateStorefrontResult {
  tenantId: string;
  subdomain: string;
}

export async function generateStorefront(
  input: GenerateStorefrontInput,
): Promise<GenerateStorefrontResult> {
  const mood = MOODS[input.moodKey];

  // Fetch the niche row — body_markdown is what the AI reads
  const { data: niche, error: nicheError } = await supabaseAdmin()
    .from('niches')
    .select('display_name, body_markdown, tenant_type_fit')
    .eq('slug', input.nicheSlug)
    .single();

  if (nicheError || !niche) {
    throw new Error(`Niche not found: ${input.nicheSlug}`);
  }

  // Run the two AI generation calls (tokens and page) in parallel
  const [tokens, page] = await Promise.all([
    generateTokens(niche.body_markdown, mood),
    generatePage(input.shopName, niche.display_name, niche.body_markdown, mood),
  ]);

  // Write everything to DB
  return writeStorefront({
    subdomain: input.subdomain,
    shopName: input.shopName,
    nicheSlug: input.nicheSlug,
    tenantTypes: niche.tenant_type_fit,
    tokens,
    page,
  });
}
