import type { MoodKey } from '@/lib/moods';

export { toSubdomain } from '@/lib/subdomain';

export const DEFAULT_PRODUCT_COUNT = 5;

export interface NicheOption {
  slug: string;
  display_name: string;
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
};
