import type { MoodKey } from '@/lib/moods';

export interface NicheOption {
  slug: string;
  display_name: string;
}

export interface OnboardingData {
  name: string;
  nicheSlug: string;
  nicheDisplayName: string;
  shopName: string;
  moodKey: MoodKey | '';
  inspirationUrls: readonly [string, string, string];
}

export const INITIAL_DATA: OnboardingData = {
  name: '',
  nicheSlug: '',
  nicheDisplayName: '',
  shopName: '',
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

/** Suggest an initial shop name from the maker's first name and niche. */
export function suggestShopName(fullName: string, nicheDisplayName: string): string {
  const first = fullName.trim().split(/\s+/)[0] ?? fullName.trim();
  return `${first}'s ${nicheDisplayName}`;
}
