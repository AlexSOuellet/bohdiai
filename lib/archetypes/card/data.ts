/**
 * Business card — what the page paints, read fresh on every render: the business
 * name, the owner's About you, their gallery in order, and their market dates
 * (only when the site has them switched on). Read with the service role (the
 * storefront has no signed-in owner).
 */
import type { ShorelineLook } from './look';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { ProfileForm } from '@/lib/backend/profile/profile-form';
import { getProfileForm } from '@/lib/backend/profile/queries';
import { listGallery } from '@/lib/backend/gallery/queries';
import { GALLERY_LIMIT, type GalleryItem } from '@/lib/backend/gallery/gallery-form';
import { loadSiteFeatures } from '@/lib/backend/features';
import { listVisitorMarketDates } from '@/lib/backend/dates/queries';
import type { MarketDate } from '@/lib/backend/dates/dates-form';
import { getSiteWords } from '@/lib/site-words/queries';
import { fill } from '@/lib/site-words/words';
import { CARD_WORD_SPOTS, CARD_WORDS_PREFIX, type CardWords } from './words';

/** The maker's own photo of themselves (About you's portrait), when they have one. */
export type Portrait = { url: string; alt: string };

export type CardData = {
  name: string;
  profile: ProfileForm;
  portrait: Portrait | null;
  photos: GalleryItem[];
  dates: MarketDate[];
  words: CardWords;
  /** On the Scenic mood: the skin's colours and fonts and the site's own photo (look.ts). Absent: the design's own. */
  look?: ShorelineLook | undefined;
  /** On the Scenic mood: the opening's words from the Headline screen. Absent: the name and About you's line. */
  opening?: { headline: string; line: string; cta: string } | undefined;
};

export async function loadCardData(db: SupabaseClient<Database>, tenantId: string): Promise<CardData> {
  const [tenant, profileForm, profile, photos, features, words] = await Promise.all([
    db.from('tenants').select('business_name').eq('id', tenantId).maybeSingle(),
    getProfileForm(db, tenantId),
    db.from('site_profiles').select('portrait:uploads(public_url, alt_text)').eq('tenant_id', tenantId).maybeSingle(),
    listGallery(db, tenantId),
    loadSiteFeatures(db, tenantId),
    getSiteWords(db, tenantId, CARD_WORD_SPOTS, CARD_WORDS_PREFIX),
  ]);
  if (tenant.error !== null) throw new Error(`Could not load the site: ${tenant.error.message}`);
  if (tenant.data === null) throw new Error('Could not load the site: no such tenant');
  if (profile.error !== null) throw new Error(`Could not load About you: ${profile.error.message}`);
  const dates = features.has('market_dates') ? await listVisitorMarketDates(db, tenantId) : [];
  const portraitUrl = profile.data?.portrait?.public_url ?? null;
  const portrait = portraitUrl === null ? null : { url: portraitUrl, alt: profile.data?.portrait?.alt_text ?? '' };
  return { name: tenant.data.business_name, profile: profileForm, portrait, photos: photos.slice(0, GALLERY_LIMIT), dates, words };
}

/** A market's day as the site says it: "Sat Oct 11", read on the market's own date;
 *  a market over several days reads "Sat Nov 21 – Sun Nov 22". */
export function marketDay(d: MarketDate, w: CardWords['dates']): string {
  return d.endDate === '' ? oneDay(d.date, w) : fill(w.range, { first: oneDay(d.date, w), last: oneDay(d.endDate, w) });
}

function oneDay(date: string, w: CardWords['dates']): string {
  const parts = new Intl.DateTimeFormat(w.locale === '' ? undefined : w.locale, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).formatToParts(
    new Date(`${date}T00:00:00Z`),
  );
  const part = (type: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === type)?.value ?? '';
  return fill(w.day, { weekday: part('weekday'), month: part('month'), day: part('day') });
}

/** The market's name as the site says it, marked when the owner canceled it. */
export function marketName(d: MarketDate, w: CardWords['dates']): string {
  return d.canceled ? fill(w.canceled, { market: d.name }) : d.name;
}

/** One market date as the marquee says it: "Sat Oct 11 · Wickford Art Festival · Wickford". */
export function marqueeDateLine(d: MarketDate, w: CardWords['dates']): string {
  return [marketDay(d, w), marketName(d, w), d.town].filter((s) => s !== '').join(w.separator);
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
export function ringText(name: string, kicker: string, separator: string): string {
  const full = kicker === '' ? `${name}${separator}${name}${separator}` : `${name}${separator}${kicker}${separator}`;
  return full.length > 34 ? `${name.slice(0, 30)}${separator}` : full;
}

/** A photo's name for screen readers: its caption, or its number when it has none. */
export function photoLabel(caption: string, n: number, w: CardWords['work']): string {
  return caption === '' ? fill(w.openNumbered, { n }) : fill(w.open, { caption });
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
