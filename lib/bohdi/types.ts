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
  makerName?: string | undefined;        // The maker's first name, captured at onboarding. Used for progress labels and as material for Bohdi's about-portrait brief.
  logoUrl?: string | undefined;          // Public URL of uploaded logo, if maker provided one.
  brandColors?: string[] | undefined;    // Hex codes extracted from the logo via Vision; honor in palette.
  voiceBoothPitch?: string | undefined;     // Maker's own words: how they'd describe their work at a craft fair booth. Bohdi uses this as raw material for the about copy.
  voiceNegativeSpace?: string | undefined;  // Maker's own words: what they don't want their site to feel like. Bohdi treats this as a constraint.
}

export interface BohdiResult {
  tenantId: string;
  subdomain: string;
}

/**
 * Bohdi accumulates these as he works. He calls set_* and add_* tools to
 * populate this state; finalize commits the whole accumulator atomically.
 */
export interface AboutPageContent {
  eyebrow: string;
  headline: string;
  intro: string;
  body: string;
  signatureName: string;
  signatureRole: string;
}

export interface BohdiAccumulator {
  tokens: DesignTokens | null;
  homePage: GeneratedPage['blocks'] | null;
  shopPageCopy: GeneratedPage['secondaryPages']['shop'] | null;
  contactPageCopy: GeneratedPage['secondaryPages']['contact'] | null;
  aboutPageContent: AboutPageContent | null;
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
    aboutPageContent: null,
    collections: [],
    listings: [],
    subscriptions: [],
    heroImageUrl: null,
    aboutImageUrl: null,
  };
}
