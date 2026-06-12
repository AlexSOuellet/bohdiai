import type { MoodKey } from '@/lib/moods';

export { toSubdomain } from '@/lib/subdomain';

export const DEFAULT_PRODUCT_COUNT = 5;
export const MAX_PRODUCT_PHOTOS = 5;

export interface NicheOption {
  slug: string;
  display_name: string;
}

/** One photo's Vision read — what Bohdi sees about a single uploaded image. */
export interface VisionPerPhoto {
  productType: string;
  suggestedName: string;
  suggestedShortDescription: string;
  suggestedDescription: string;
  suggestedPriceCents: number;
}

export interface OnboardingData {
  nicheSlug: string;
  nicheDisplayName: string;
  nicheDescription: string;
  shopName: string;
  makerName: string;
  subdomain: string;
  moodKey: MoodKey | '';
  productCount: number;
  logoUrl: string;
  brandColors: string[];
  /** Up to 5 photo URLs the maker uploaded at onboarding. Empty = skipped. */
  productPhotoUrls: string[];
  /** Per-photo Vision read, one entry per upload in upload order. Empty when
   *  uploads were skipped or Vision failed (build degrades to current behavior). */
  visionPerPhoto: VisionPerPhoto[];
  /** Cross-photo Vision summary — 2-3 sentences on what this maker actually
   *  makes. Threads into the Director and Cinematographer briefs. */
  makerWork: string;
}

export const INITIAL_DATA: OnboardingData = {
  nicheSlug: '',
  nicheDisplayName: '',
  nicheDescription: '',
  shopName: '',
  makerName: '',
  subdomain: '',
  moodKey: '',
  productCount: DEFAULT_PRODUCT_COUNT,
  logoUrl: '',
  brandColors: [],
  productPhotoUrls: [],
  visionPerPhoto: [],
  makerWork: '',
};
