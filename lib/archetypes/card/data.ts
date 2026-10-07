/**
 * Business card — what the page paints, read fresh on every render: the business
 * name, the owner's About you, their gallery in order, and their market dates
 * (only when the site has them switched on). Read with the service role (the
 * storefront has no signed-in owner).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { profileFormFromRow, type ProfileForm } from '@/lib/backend/profile/profile-form';
import { PROFILE_COLUMNS } from '@/lib/backend/profile/queries';
import { listGallery } from '@/lib/backend/gallery/queries';
import { GALLERY_LIMIT, type GalleryItem } from '@/lib/backend/gallery/gallery-form';
import { loadSiteFeatures } from '@/lib/backend/features';
import { listMarketDates } from '@/lib/backend/dates/queries';
import type { MarketDate } from '@/lib/backend/dates/dates-form';
import { CARD_STRINGS as S } from './strings';

export type CardData = { name: string; profile: ProfileForm; photos: GalleryItem[]; dates: MarketDate[] };

export async function loadCardData(db: SupabaseClient<Database>, tenantId: string): Promise<CardData> {
  const [tenant, profile, photos, features] = await Promise.all([
    db.from('tenants').select('business_name').eq('id', tenantId).maybeSingle(),
    db.from('site_profiles').select(PROFILE_COLUMNS).eq('tenant_id', tenantId).maybeSingle(),
    listGallery(db, tenantId),
    loadSiteFeatures(db, tenantId),
  ]);
  if (tenant.error !== null) throw new Error(`Could not load the site: ${tenant.error.message}`);
  if (tenant.data === null) throw new Error('Could not load the site: no such tenant');
  if (profile.error !== null) throw new Error(`Could not load About you: ${profile.error.message}`);
  const dates = features.has('market_dates') ? await listMarketDates(db, tenantId) : [];
  return { name: tenant.data.business_name, profile: profileFormFromRow(profile.data), photos: photos.slice(0, GALLERY_LIMIT), dates };
}

/** A market's day as the site says it: "Sat Oct 11", read on the market's own date;
 *  a market over several days reads "Sat Nov 21 – Sun Nov 22". */
export function marketDay(d: MarketDate): string {
  return d.endDate === '' ? oneDay(d.date) : S.dates.range(oneDay(d.date), oneDay(d.endDate));
}

function oneDay(date: string): string {
  const parts = new Intl.DateTimeFormat(S.dates.locale, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).formatToParts(
    new Date(`${date}T00:00:00Z`),
  );
  const part = (type: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === type)?.value ?? '';
  return S.dates.day(part('weekday'), part('month'), part('day'));
}

/** The market's name as the site says it, marked when the owner canceled it. */
export function marketName(d: MarketDate): string {
  return d.canceled ? S.dates.canceled(d.name) : d.name;
}

/** One market date as the marquee says it: "Sat Oct 11 · Wickford Art Festival · Wickford". */
export function marqueeDateLine(d: MarketDate): string {
  return S.dates.line(marketDay(d), marketName(d), d.town);
}

/** Enough copies of the bottom row's items to fill a wide screen, always an even
 *  number of sets so the half-way loop point lines up. */
export function marqueeFill(items: readonly string[], atLeast = 12): string[] {
  if (items.length === 0) return [];
  const sets = 2 * Math.ceil(atLeast / 2 / items.length);
  return Array.from({ length: sets }, () => items).flat();
}

/** The two or three letters in the maker's stamp: first letters of the name's words. */
export function initials(name: string): string {
  const letters = name
    .split(/[\s&+\-–—]+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, '').charAt(0))
    .filter((c) => c !== '');
  return (letters.length === 0 ? name.charAt(0) : letters.slice(0, 3).join('')).toUpperCase();
}

/** The ring of words around the stamp, kept short enough to fit once around. */
export function ringText(name: string, kicker: string): string {
  const full = kicker === '' ? `${name} · ${name} · ` : `${name} · ${kicker} · `;
  return full.length > 34 ? `${name.slice(0, 30)} · ` : full;
}

export function bioParagraphs(bio: string): string[] {
  return bio.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p !== '');
}

/** The marquee's words, from the owner's own data: their tag line, then their
 *  photo captions, each once, in order. Nothing hardcoded. */
export function marqueeWords(kicker: string, captions: readonly string[]): string[] {
  const seen = new Set<string>();
  const words: string[] = [];
  for (const raw of [kicker, ...captions]) {
    const w = raw.trim();
    const key = w.toLowerCase();
    if (w === '' || seen.has(key)) continue;
    seen.add(key);
    words.push(w);
  }
  return words;
}
