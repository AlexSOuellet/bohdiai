// Storefront generation entry point. ONE engine: every niche flows through the
// archetype build path, where Bohdi chooses the archetype and look, authors the
// store, and generates the assets. No niche gate, no selection rules.

import type { MoodKey } from '@/lib/moods';
import type { ProgressEmitter } from '@/lib/progress';
import { buildArchetypeStore } from './build-archetype-store';

export interface RunStorefrontInput {
  shopName: string;
  subdomain: string;
  nicheSlug: string;
  nicheDescription?: string | undefined;
  moodKey: MoodKey;
  productCount: number;
  makerName?: string | undefined;
  logoUrl?: string | undefined;
  brandColors?: string[] | undefined;
}

export interface RunStorefrontResult {
  tenantId: string;
  subdomain: string;
}

export async function runStorefront(
  input: RunStorefrontInput,
  onProgress?: ProgressEmitter,
): Promise<RunStorefrontResult> {
  return buildArchetypeStore(
    {
      shopName: input.shopName,
      subdomain: input.subdomain,
      nicheSlug: input.nicheSlug,
      nicheDescription: input.nicheDescription,
      moodKey: input.moodKey,
      productCount: input.productCount,
      makerName: input.makerName,
      logoUrl: input.logoUrl,
    },
    onProgress,
  );
}
