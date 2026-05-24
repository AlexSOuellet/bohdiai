import type { MoodKey } from '@/lib/moods';

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
  inspirationUrls: readonly [string, string, string];
}

export const INITIAL_DATA: OnboardingData = {
  nicheSlug: '',
  nicheDisplayName: '',
  shopName: '',
  subdomain: '',
  moodKey: '',
  inspirationUrls: ['', '', ''],
};

/** Derive a subdomain slug from the maker's chosen shop name. */
export function toSubdomain(shopName: string): string {
  return shopName
    .toLowerCase()
    .replace(/[''`']/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}
