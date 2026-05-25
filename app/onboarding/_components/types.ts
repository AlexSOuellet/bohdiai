import type { MoodKey } from '@/lib/moods';

export interface NicheOption {
  slug: string;
  display_name: string;
}

export const PRODUCT_COUNT_OPTIONS = [
  { label: "I'm just starting out", value: 3 },
  { label: 'A solid collection', value: 8 },
  { label: "I've got a catalog", value: 15 },
] as const;

export interface OnboardingData {
  nicheSlug: string;
  nicheDisplayName: string;
  shopName: string;
  subdomain: string;
  moodKey: MoodKey | '';
  productCount: number;
  inspirationUrls: readonly [string, string, string];
}

export const INITIAL_DATA: OnboardingData = {
  nicheSlug: '',
  nicheDisplayName: '',
  shopName: '',
  subdomain: '',
  moodKey: '',
  productCount: 3,
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
