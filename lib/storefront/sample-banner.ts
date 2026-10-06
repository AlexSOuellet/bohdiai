/**
 * The strip across the top of every page of a sample site (Alex, 2026-10-04):
 * which plan it shows ("Showcase sample"), linking to the maker pricing. Which
 * sites are samples, and their plans, come from the one list bohdiai.com shows
 * (lib/site/work.ts), so a real client's site can never carry it.
 */
import { SAMPLES, sampleAudience } from '@/lib/site/work';
import { PLATFORM_URL } from './platform-credit';

export const SAMPLE_BANNER_STRINGS = {
  label: (plan: string) => `${plan} sample`,
  /** Read after the label by screen readers, so the link says where it goes. */
  linkHint: 'See plans and prices at BohdiAI',
} as const;

export type SampleBanner = { label: string; href: string };

/** The banner for a storefront subdomain, or null when the site isn't a sample. */
export function sampleBannerFor(subdomain: string | null): SampleBanner | null {
  if (subdomain === null) return null;
  const sample = SAMPLES.find((s) => s.host === `${subdomain}.bohdiai.com`);
  if (sample?.plan === undefined) return null;
  const page = sampleAudience(sample) === 'contractor' ? 'contractors' : 'makers';
  return { label: SAMPLE_BANNER_STRINGS.label(sample.plan), href: `${PLATFORM_URL}/${page}#plans` };
}
