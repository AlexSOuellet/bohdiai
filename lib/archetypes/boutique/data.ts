/**
 * Boutique — what the page reads besides the catalog, fresh on every render: the
 * business name, the owner's About you, and their market dates (only when the site
 * has Market dates switched on). Read with the service role.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { ProductView } from '@/lib/archetypes/content';
import { profileFormFromRow, type ProfileForm } from '@/lib/backend/profile/profile-form';
import { PROFILE_COLUMNS } from '@/lib/backend/profile/queries';
import { loadSiteFeatures } from '@/lib/backend/features';
import { listMarketDates } from '@/lib/backend/dates/queries';
import type { MarketDate } from '@/lib/backend/dates/dates-form';
import { NURSERY_STRINGS as S } from './strings';

export type BoutiqueData = { name: string; profile: ProfileForm; dates: MarketDate[] };

export async function loadBoutiqueData(
  db: SupabaseClient<Database>,
  tenantId: string,
): Promise<BoutiqueData> {
  const [tenant, profile, features] = await Promise.all([
    db.from('tenants').select('business_name').eq('id', tenantId).maybeSingle(),
    db.from('site_profiles').select(PROFILE_COLUMNS).eq('tenant_id', tenantId).maybeSingle(),
    loadSiteFeatures(db, tenantId),
  ]);
  if (tenant.error !== null) throw new Error(`Could not load the site: ${tenant.error.message}`);
  if (tenant.data === null) throw new Error('Could not load the site: no such tenant');
  if (profile.error !== null) throw new Error(`Could not load About you: ${profile.error.message}`);
  const dates = features.has('market_dates') ? await listMarketDates(db, tenantId) : [];
  return { name: tenant.data.business_name, profile: profileFormFromRow(profile.data), dates };
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
    const cents = Math.round(Number(p.price.replace(/[^0-9.]/g, '')) * 100);
    if (!Number.isFinite(cents) || cents <= 0) continue;
    if (best === null || cents < best.cents)
      best = { cents, label: p.price.replace(/^from\s+/i, '') };
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

/** A market's day for the visiting-hours board: weekday, "Oct 17". */
export function visitDay(d: MarketDate): { weekday: string; day: string } {
  const date = new Date(`${d.date}T00:00:00Z`);
  const weekday = new Intl.DateTimeFormat(S.visit.locale, {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(date);
  const day = new Intl.DateTimeFormat(S.visit.locale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
  return { weekday, day };
}
