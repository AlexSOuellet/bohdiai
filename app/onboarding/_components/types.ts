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
  subdomain: string;
  moodKey: MoodKey | '';
  productCount: number;
}

export const INITIAL_DATA: OnboardingData = {
  nicheSlug: '',
  nicheDisplayName: '',
  shopName: '',
  subdomain: '',
  moodKey: '',
  productCount: DEFAULT_PRODUCT_COUNT,
};
