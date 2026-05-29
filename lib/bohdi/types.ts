// Bohdi's input and output shapes. The brief is what the platform hands him
// at the start of a job; the result is what comes back when he finalizes.

import type { DesignTokens } from '@/lib/tokens';
import type { GeneratedPage } from '@/lib/generation/generate-page';
import type { GeneratedCollection } from '@/lib/generation/generate-collections';
import type { GeneratedListingWithImage } from '@/lib/generation/generate-listings';
import type { GeneratedSubscriptionWithImage } from '@/lib/generation/write-storefront';

export interface BohdiBrief {
  shopName: string;
  subdomain: string;
  nicheSlug: string;
  moodKey: string;
  productCount: number;
}

export interface BohdiResult {
  tenantId: string;
  subdomain: string;
}

/**
 * Bohdi accumulates these as he works. He calls set_* and add_* tools to
 * populate this state; finalize commits the whole accumulator atomically.
 */
export interface BohdiAccumulator {
  tokens: DesignTokens | null;
  homePage: GeneratedPage['blocks'] | null;
  shopPageCopy: GeneratedPage['secondaryPages']['shop'] | null;
  contactPageCopy: GeneratedPage['secondaryPages']['contact'] | null;
  collections: GeneratedCollection[];
  listings: GeneratedListingWithImage[];
  subscriptions: GeneratedSubscriptionWithImage[];
  heroImageUrl: string | null;
  aboutImageUrl: string | null;
}

export function emptyAccumulator(): BohdiAccumulator {
  return {
    tokens: null,
    homePage: null,
    shopPageCopy: null,
    contactPageCopy: null,
    collections: [],
    listings: [],
    subscriptions: [],
    heroImageUrl: null,
    aboutImageUrl: null,
  };
}
