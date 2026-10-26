/**
 * Boutique — what the page reads besides the catalog, fresh on every render: the
 * business name, the owner's About you, and their market dates (only when the site
 * has Market dates switched on). Read with the service role.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { ProductView } from '@/lib/archetypes/content';
import type { ProfileForm } from '@/lib/backend/profile/profile-form';
import { getProfileForm } from '@/lib/backend/profile/queries';
import { loadSiteFeatures } from '@/lib/backend/features';
import { listVisitorMarketDates } from '@/lib/backend/dates/queries';
import { listGallery } from '@/lib/backend/gallery/queries';
import { GALLERY_LIMIT, type GalleryItem } from '@/lib/backend/gallery/gallery-form';
import type { MarketDate } from '@/lib/backend/dates/dates-form';
import { loadShopPromotions } from '@/lib/storefront/promotions-load';
import { runningSale } from '@/lib/storefront/promotions';
import { getSiteWords } from '@/lib/site-words/queries';
import { fill } from '@/lib/site-words/words';
import { accountNavLabel } from '@/lib/buyers/nav';
import { NURSERY_WORD_SPOTS, NURSERY_WORDS_PREFIX, type NurseryWords } from './words';

/** `gone` is the gallery: the owner's past pieces, shown when Gallery is switched on. */
export type BoutiqueData = {
  name: string;
  profile: ProfileForm;
  dates: MarketDate[];
  gone: GalleryItem[];
  /** The cart is switched on: pieces can be added and the order sent. */
  cart: boolean;
  /** The menu's Account link when buyers can sign in (Full, her switch on); null otherwise. */
  account: string | null;
  /** Market and Full: each market has its own page on the site (Alex, 2026-10-22). */
  marketPages: boolean;
  /** New arrivals are switched on: babies ticked new get the Just born section and a ribbon. */
  newArrivals: boolean;
  /** The sale running today, if any: every baby shows its sale price under a banner. */
  sale: { name: string; percentOff: number; endsOn: string | null } | null;
  /** The site's own words for every spot the design paints. */
  words: NurseryWords;
};

export async function loadBoutiqueData(
  db: SupabaseClient<Database>,
  tenantId: string,
): Promise<BoutiqueData> {
  const [tenant, profile, features, words] = await Promise.all([
    db.from('tenants').select('business_name').eq('id', tenantId).maybeSingle(),
    getProfileForm(db, tenantId),
    loadSiteFeatures(db, tenantId),
    getSiteWords(db, tenantId, NURSERY_WORD_SPOTS, NURSERY_WORDS_PREFIX),
  ]);
  if (tenant.error !== null) throw new Error(`Could not load the site: ${tenant.error.message}`);
  if (tenant.data === null) throw new Error('Could not load the site: no such tenant');
  const [dates, gone, promo] = await Promise.all([
    features.has('market_dates') ? listVisitorMarketDates(db, tenantId) : Promise.resolve([]),
    features.has('gallery') ? listGallery(db, tenantId) : Promise.resolve([]),
    loadShopPromotions(db, tenantId),
  ]);
  const sale = runningSale(promo.promos, promo.today);
  return {
    name: tenant.data.business_name,
    profile,
    dates,
    gone: gone.slice(0, GALLERY_LIMIT),
    cart: features.has('cart'),
    account: await accountNavLabel(db, tenantId, features),
    marketPages: features.has('market_shop'),
    newArrivals: features.has('new_arrivals'),
    sale: sale === null || sale.percentOff === null ? null : { name: sale.name, percentOff: sale.percentOff, endsOn: sale.endsOn },
    words,
  };
}

/** The babies the home shows: the owner's home picks, or the first few live ones. */
export function homeBabies(products: readonly ProductView[], max = 5): ProductView[] {
  const picked = products.filter((p) => p.onHome === true);
  return (picked.length > 0 ? picked : products).slice(0, max);
}

/** The lowest price in the nursery as shown ("$120"), from the products' own
 *  formatted prices; null when there is nothing priced. */
export function lowestPrice(products: readonly ProductView[]): string | null {
  let best: { cents: number; label: string } | null = null;
  for (const p of products) {
    const shown = p.salePrice ?? p.price;
    const cents = Math.round(Number(shown.replace(/[^0-9.]/g, '')) * 100);
    if (!Number.isFinite(cents) || cents <= 0) continue;
    if (best === null || cents < best.cents)
      best = { cents, label: shown.replace(/^from\s+/i, '') };
  }
  return best === null ? null : best.label;
}

/** Each card wears one of the nursery colors in turn, so neighbours never match. */
export const CARD_TINTS = ['blush', 'sage', 'lilac', 'sky'] as const;
export type CardTint = (typeof CARD_TINTS)[number];
export function cardTint(i: number): CardTint {
  return CARD_TINTS[((i % CARD_TINTS.length) + CARD_TINTS.length) % CARD_TINTS.length] ?? 'blush';
}

export function bioParagraphs(bio: string): string[] {
  return bio
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p !== '');
}

/** A market's day for the visiting-hours board: "Saturday", "Oct 17". A market over
 *  several days reads "Saturday – Sunday", "Nov 21 – 22". */
export function visitDay(d: MarketDate, w: NurseryWords['visit']): { weekday: string; day: string } {
  const first = new Date(`${d.date}T00:00:00Z`);
  const locale = w.locale === '' ? undefined : w.locale;
  const weekdays = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' });
  const days = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' });
  if (d.endDate === '' || d.endDate === d.date) return { weekday: weekdays.format(first), day: days.format(first) };
  const last = new Date(`${d.endDate}T00:00:00Z`);
  return { weekday: fill(w.range, { first: weekdays.format(first), last: weekdays.format(last) }), day: days.formatRange(first, last) };
}

/** A photo's name for screen readers: its caption, or its number when it has none. */
export function photoLabel(caption: string, n: number, w: NurseryWords['gone']): string {
  return caption === '' ? fill(w.openNumbered, { n }) : fill(w.open, { caption });
}

/** How many babies are waiting, as the site says it: one, or a count. */
export function waitingCount(n: number, w: NurseryWords['nursery']): string {
  return n === 1 ? w.countOne : fill(w.count, { n });
}

/** The clothesline hangs the gallery in short runs, so each line sags like a real one. */
export function clotheslines<T>(items: readonly T[], perLine = 4): T[][] {
  const lines: T[][] = [];
  for (let i = 0; i < items.length; i += perLine) lines.push(items.slice(i, i + perLine));
  return lines;
}
