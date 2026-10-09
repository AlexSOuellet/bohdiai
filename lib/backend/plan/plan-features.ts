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

const SHOWCASE: readonly FeatureKey[] = ['profile', 'gallery', 'market_dates', 'qr_codes', 'plan'];
const LITE: readonly FeatureKey[] = [...SHOWCASE, 'catalog', 'market_details', 'market_shop'];
const FULL: readonly FeatureKey[] = [
  ...LITE,
  'product_photos',
  'digital_products',
  'testimonials',
  'cart',
  'promotions',
  'new_arrivals',
  'market_records',
];

export const PLAN_FEATURES: Record<SitePlan, readonly FeatureKey[]> = {
  showcase: SHOWCASE,
  lite: LITE,
  full: FULL,
};

/** Every switch a plan decides. */
export const PLAN_MANAGED: readonly FeatureKey[] = FULL;

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
  catalog: 'Your products and collections, with prices',
  market_details: 'Market hours, addresses, booths and websites',
  market_shop: 'The point of sale at markets: the QR shop page, Getting paid and Today',
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
