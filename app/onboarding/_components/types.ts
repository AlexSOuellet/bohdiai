import type { MoodKey } from '@/lib/moods';

export { toSubdomain } from '@/lib/subdomain';

export const DEFAULT_PRODUCT_COUNT = 4;

export interface NicheOption {
  slug: string;
  display_name: string;
}

export interface OnboardingData {
  nicheSlug: string;
  nicheDisplayName: string;
  shopName: string;
  makerName: string;        // The maker's first name. Used for personalized progress labels and for the about-portrait brief.
  subdomain: string;
  moodKey: MoodKey | '';
  productCount: number;
  logoUrl: string;          // Empty string = no logo uploaded.
  brandColors: string[];    // Hex codes from Vision; empty if no logo or extraction failed.
}

export const INITIAL_DATA: OnboardingData = {
  nicheSlug: '',
  nicheDisplayName: '',
  shopName: '',
  makerName: '',
  subdomain: '',
  moodKey: '',
  productCount: DEFAULT_PRODUCT_COUNT,
  logoUrl: '',
  brandColors: [],
};
