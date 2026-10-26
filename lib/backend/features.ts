/**
 * Per-site feature switches (Maker Backend piece 1, spec §2). Alex decides which
 * features a site has; the client never sees a switch. A site with no row for a
 * key gets the key's default here. Later pieces add their keys to FEATURES.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export const FEATURES = {
  catalog: { default: true, description: 'Products: the shop page with prices, and a page for each piece' },
  collections: { default: true, description: 'Collections: groups of products, with their own pages (Full; Market has none)' },
  video: { default: false, description: 'One short video per product (Cloudflare Stream)' },
  digital_products: { default: false, description: 'Products or choices sold as downloadable files' },
  custom_domain_panel: { default: true, description: 'Domain status on the home screen and in settings' },
  profile: { default: false, description: 'About you: the words and contact details on a business card site' },
  gallery: { default: false, description: 'Gallery photos with captions, in the owner’s order' },
  cart: { default: false, description: 'Cart: shoppers gather pieces and send the order (paid by card once payments are connected)' },
  market_shop: { default: false, description: 'Market shop: a QR page per market where buyers pick a piece and pay (Venmo, Cash App, Zelle, cash), plus Getting paid and Today' },
  promotions: { default: false, description: 'Promotions: a site-wide sale or discount codes, taken off in the cart' },
  new_arrivals: { default: false, description: 'New arrivals: a tick on each product, shown in the design’s own home section' },
  qr_codes: { default: true, description: 'QR codes: a printable code for the site, its shop, or one product' },
  plan: { default: false, description: 'Your plan: the plan the site is on and what moving up adds' },
  product_photos: { default: true, description: 'Up to 12 photos on each product (Full); off, a product shows its main photo only (Lite)' },
  testimonials: { default: false, description: 'Testimonials: what customers say (Market and Full)' },
  testimonials_all: { default: true, description: 'Every testimonial shows on the site (Full); off, the site shows up to three, the ticked ones first (Market)' },
  market_details: { default: false, description: 'Market details: hours, address, booth and website on each market (Lite up; Showcase is day, market and town)' },
  market_records: { default: false, description: 'Market records: private costs, organizer, notes and a review on each market (Full)' },
  demo_checkout: { default: false, description: 'Demo checkout: Upgrade and Downgrade switch the plan at once, no card taken (demo sites only)' },
  moment: { default: false, description: 'The moment: the first thing a visitor sees (story lines, headline, buttons, its photo and extra photos)' },
  market_dates: { default: false, description: 'Markets: every market the owner does, shown on the site (dates, hours, where) with private costs, notes and review' },
  headline: { default: false, description: 'Headline: the big words at the top of the home page and the line under it (every plan; the rest of the moment stays as built)' },
  background: { default: false, description: 'Background: her own photo behind her pages (the Rustic look shows it) and the photo behind her site in Scenic (standard sites, every plan)' },
  buyer_accounts: { default: false, description: 'Buyer accounts: buyers sign in on the shop to see their orders and reorder; the owner switches them on or off (Full; below Full they are kept but can’t sign in)' },
  try_on: { default: false, description: 'Try on a look: the owner sees her own site in every mood from the backend, and keeps the one she likes (Full)' },
  gallery_pieces: { default: false, description: 'Gallery from the catalog (Showcase): the whole catalog in the backend, no shop; the site shows up to 12 ticked pieces (newest 12 when none are ticked), no prices' },
} as const satisfies Record<string, { default: boolean; description: string }>;

export type FeatureKey = keyof typeof FEATURES;
export const FEATURE_KEYS = Object.keys(FEATURES) as FeatureKey[];

export function isFeatureKey(value: string): value is FeatureKey {
  return (FEATURE_KEYS as readonly string[]).includes(value);
}

export type FeatureRow = { feature_key: string; enabled: boolean };

/** The set of features on for a site, from its rows plus the code defaults. */
export function resolveFeatures(rows: readonly FeatureRow[]): Set<FeatureKey> {
  const overrides = new Map<FeatureKey, boolean>();
  for (const row of rows) if (isFeatureKey(row.feature_key)) overrides.set(row.feature_key, row.enabled);
  return new Set(FEATURE_KEYS.filter((key) => overrides.get(key) ?? FEATURES[key].default));
}

export async function loadSiteFeatures(db: SupabaseClient<Database>, tenantId: string): Promise<Set<FeatureKey>> {
  const { data, error } = await db.from('tenant_features').select('feature_key, enabled').eq('tenant_id', tenantId);
  if (error !== null) throw new Error(`Could not load site features: ${error.message}`);
  return resolveFeatures((data ?? []) as FeatureRow[]);
}

/** The Products screen is open when the site has its shop (catalog) or shows its
 *  gallery from the catalog (Showcase: products in the backend, no shop). */
export function hasProducts(on: ReadonlySet<FeatureKey>): boolean {
  return on.has('catalog') || on.has('gallery_pieces');
}

export function hasFeature(on: ReadonlySet<FeatureKey>, key: FeatureKey): boolean {
  return on.has(key);
}
