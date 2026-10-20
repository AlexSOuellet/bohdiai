/**
 * What each maker plan switches on (Saltmarsh & Lace demo spec, stage two). A plan
 * is a set of the per-site feature switches; moving between plans flips only
 * the switches the plans decide and never touches the rest (domain panel, demo
 * checkout, video until it's built). A downgrade hides; nothing is deleted.
 *
 * Markets step up by plan (Alex, 2026-10-09): Showcase reports day, market and town
 * only; Lite adds hours, address, booth, website and the point of sale; Full adds
 * costs, organizer, notes, reviews.
 */
import type { FeatureKey } from '../features';
import { SITE_PLANS, type SitePlan } from './plan';
import { LINK_TARGETS, type LinkTarget } from '@/lib/archetypes/main-street/links';

/** Every plan: About you, markets, the QR code, the plan screen, and the headline at
 *  the top of the home page (the headline and the line under it; Alex, 2026-10-19). */
const EVERY_PLAN: readonly FeatureKey[] = ['profile', 'market_dates', 'qr_codes', 'plan', 'headline'];
/** Showcase (Alex, 2026-10-19): the whole catalog in the backend with no shop and no
 *  prices on the site; the gallery is up to 12 ticked pieces (newest 12 by default). */
const SHOWCASE: readonly FeatureKey[] = [...EVERY_PLAN, 'gallery_pieces'];
/** Market (Alex, 2026-10-11 and 2026-10-20): everything Showcase has, the whole catalog with prices,
 *  and the whole market app (records, costs and results included). No online selling,
 *  promotions, collections or extra photos; a few testimonials the maker types in. */
const LITE: readonly FeatureKey[] = [...EVERY_PLAN, 'gallery', 'catalog', 'market_details', 'market_shop', 'market_records', 'testimonials'];
const FULL: readonly FeatureKey[] = [
  ...LITE,
  'collections',
  'testimonials_all',
  'product_photos',
  'digital_products',
  'cart',
  'promotions',
  'new_arrivals',
];

export const PLAN_FEATURES: Record<SitePlan, readonly FeatureKey[]> = {
  showcase: SHOWCASE,
  lite: LITE,
  full: FULL,
};

/** Every switch a plan decides. */
export const PLAN_MANAGED: readonly FeatureKey[] = [...new Set([...SHOWCASE, ...FULL])];

/** The rows that put a site on `plan`: each managed switch on or off. */
export function planFeatureRows(plan: SitePlan): { feature_key: FeatureKey; enabled: boolean }[] {
  const on = new Set(PLAN_FEATURES[plan]);
  return PLAN_MANAGED.map((key) => ({ feature_key: key, enabled: on.has(key) }));
}

export type Move = 'up' | 'down' | 'same';

export function moveOf(from: SitePlan, to: SitePlan): Move {
  const diff = SITE_PLANS.indexOf(to) - SITE_PLANS.indexOf(from);
  return diff > 0 ? 'up' : diff < 0 ? 'down' : 'same';
}

/** What a maker sees named for each switch a move adds or hides. */
export const FEATURE_WORDS: Partial<Record<FeatureKey, string>> = {
  catalog: 'Your shop page and prices (your products are kept)',
  market_details: 'Market hours, addresses, booths and websites',
  market_shop: 'The point of sale at markets: the QR shop page, Getting paid and Today',
  collections: 'Collections and their pages (your collections are kept)',
  testimonials_all: 'Every testimonial on your site (Market shows up to three; the rest are kept)',
  product_photos: 'Extra photos on each product (the main photo stays)',
  digital_products: 'Selling downloads (your download products are kept)',
  testimonials: 'Testimonials on your site',
  cart: 'The cart and online orders',
  promotions: 'Sales and discount codes',
  new_arrivals: 'New arrivals on your home page',
  market_records: 'Market costs, organizer details, notes and reviews',
};

/** The switches a move from `from` to `to` turns off, in plan order, as words. */
export function hiddenByMove(from: SitePlan, to: SitePlan): string[] {
  const keep = new Set(PLAN_FEATURES[to]);
  return PLAN_FEATURES[from].filter((k) => !keep.has(k)).flatMap((k) => FEATURE_WORDS[k] ?? []);
}

/** The pages a link can point at on a plan. Without the catalog (Showcase) there is
 *  no shop and no collections, so no button may point at them. */
export function planLinkTargets(plan: SitePlan): readonly LinkTarget[] {
  return linkTargetsFor(PLAN_FEATURES[plan].includes('catalog'), PLAN_FEATURES[plan].includes('collections'));
}

/** The same, from whether a site has its catalog and its collections switched on. */
export function linkTargetsFor(hasCatalog: boolean, hasCollections: boolean): readonly LinkTarget[] {
  return LINK_TARGETS.filter((t) => (t !== 'shop' || hasCatalog) && (t !== 'collections' || (hasCatalog && hasCollections)));
}
