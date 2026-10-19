/**
 * A family page's content, assembled from the site's homes (Modular Plan step 3).
 * Every piece comes from where it lives: the moment from `site_moments`, each
 * section's words from `site_sections`, the founder and marquee from About you,
 * testimonials and market dates from their own tables. Nothing is read from the
 * page record, so a site keeps every word when it changes design.
 *
 * Words a site hasn't filled stay empty. The design shows only what is there.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { loadSiteFeatures } from '@/lib/backend/features';
import { linkTargetsFor } from '@/lib/backend/plan/plan-features';
import type { LinkTarget } from './links';
import { getMoment } from '@/lib/backend/moment/queries';
import type { MomentView } from '@/lib/backend/moment/moment-form';
import { getSiteSections } from '@/lib/backend/sections/queries';
import type { SectionWords, SiteSections } from '@/lib/backend/sections/sections-form';
import { getPortraitUrl, getProfileForm } from '@/lib/backend/profile/queries';
import type { ProfileForm } from '@/lib/backend/profile/profile-form';
import { listTestimonials } from '@/lib/backend/testimonials/queries';
import type { Testimonial } from '@/lib/backend/testimonials/testimonial-form';
import { listVisitorMarketDates } from '@/lib/backend/dates/queries';
import type { MarketDate } from '@/lib/backend/dates/dates-form';
import { fill } from '@/lib/site-words/words';
import { findUsLocale } from './findus';
import type { FamilyWords } from './words';
import type { MainStreetView } from './schemas';
import { loadSiteGallery, type GalleryPiece } from '@/lib/storefront/site-gallery';

/** Everything a family page reads, gathered from the homes. */
export type FamilyHomes = {
  name: string;
  /** Maker Full: the site sells online (the cart is on). */
  sellsOnline: boolean;
  /** The pages a button may point at on this site's plan (Showcase has no shop). */
  linkTargets: readonly LinkTarget[];
  moment: MomentView;
  sections: SiteSections;
  profile: ProfileForm;
  portraitUrl: string | null;
  testimonials: Testimonial[];
  dates: MarketDate[];
  /** The gallery section's pieces (empty when the site has none). */
  gallery: GalleryPiece[];
};

const orUndefined = (s: string): string | undefined => (s === '' ? undefined : s);

/** A button's target, kept only when the site's plan has that page; otherwise no
 *  button (a site moved down to Showcase must not point at a shop it no longer has). */
function openTarget<T extends string>(target: T | '', open: readonly LinkTarget[]): (T & LinkTarget) | undefined {
  return target !== '' && (open as readonly string[]).includes(target) ? (target as T & LinkTarget) : undefined;
}

/** A market's day as a family page writes it, in the site's words: "Sat Oct 11", or a range. */
export function familyMarketDay(d: Pick<MarketDate, 'date' | 'endDate'>, w: FamilyWords): string {
  const one = (date: string): string => {
    const parts = new Intl.DateTimeFormat(findUsLocale(w.dateLocale), { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).formatToParts(
      new Date(`${date}T00:00:00Z`),
    );
    const part = (type: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === type)?.value ?? '';
    return fill(w.marketDay, { weekday: part('weekday'), month: part('month'), day: part('day') });
  };
  return d.endDate === '' ? one(d.date) : fill(w.marketRange, { first: one(d.date), last: one(d.endDate) });
}

/** Where a market is, in the site's words: "Wickford Art Festival, Wickford", marked when canceled. */
function marketWhere(d: MarketDate, w: FamilyWords): string {
  const market = d.canceled ? fill(w.marketCanceled, { market: d.name }) : d.name;
  return d.town === '' ? market : fill(w.marketWhere, { market, town: d.town });
}

type FindUs = NonNullable<MainStreetView['founder']['findUs']>;

function findUsFrom(markets: SectionWords, dates: readonly MarketDate[], w: FamilyWords): FindUs | undefined {
  if (dates.length === 0) return undefined;
  return {
    label: markets.title,
    title: orUndefined(markets.pageTitle),
    eventsLabel: orUndefined(markets.moreLabel),
    rows: dates.map((d) => ({
      day: familyMarketDay(d, w),
      where: marketWhere(d, w),
      time: d.hours,
      date: d.date,
    })),
  };
}

/** Bio paragraphs: About you keeps them split by a blank line. */
function paragraphs(bio: string): string[] {
  return bio.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p !== '');
}

/** A family page's view from the homes; `w` is the site's words, for its market dates. */
export function familyViewFromHomes(h: FamilyHomes, w: FamilyWords): MainStreetView {
  const { moment: m, sections: s, profile: p } = h;
  const story = paragraphs(p.bio);
  return {
    shopName: h.name,
    identity: { wordmark: h.name, sellsOnline: h.sellsOnline },
    moment: {
      media: m.media === null
        ? { kind: 'still', alt: '' }
        : {
            kind: m.media.kind === 'video' ? 'video' : 'still',
            url: m.media.url,
            ...(m.media.posterUrl === '' ? {} : { poster: m.media.posterUrl }),
            alt: m.media.alt,
          },
      story: m.story,
      eyebrow: m.kicker,
      brand: m.headline,
      sub: orUndefined(m.sub),
      playMode: m.playMode,
      collageShots: m.photos.length === 0 ? undefined : m.photos.map((x) => ({ url: x.url, alt: x.alt })),
      ctaLabel: m.ctaLabel,
      ctaTarget: openTarget(m.ctaTarget, h.linkTargets),
      secondaryCtaLabel: orUndefined(m.secondCtaLabel),
      secondaryCtaTarget: openTarget(m.secondCtaTarget, h.linkTargets),
    },
    goods: { title: s.work.title, label: orUndefined(s.work.kicker), viewAllLabel: orUndefined(s.work.moreLabel) },
    gallery: h.gallery.length === 0 ? undefined : { title: s.gallery.title, label: orUndefined(s.gallery.kicker), items: h.gallery },
    socials: p.facebookUrl === '' && p.instagramUrl === '' ? undefined : { facebookUrl: p.facebookUrl, instagramUrl: p.instagramUrl },
    phone: orUndefined(p.phone),
    collections: { title: s.collections.title, label: orUndefined(s.collections.kicker), viewAllLabel: orUndefined(s.collections.moreLabel) },
    reviews: h.testimonials.length === 0
      ? undefined
      : {
          title: s.reviews.title,
          label: orUndefined(s.reviews.kicker),
          viewAllLabel: orUndefined(s.reviews.moreLabel),
          items: h.testimonials.map((t) => ({ quote: t.quote, author: t.name, location: orUndefined(t.detail) })),
        },
    marquee: p.marqueePhrases.length === 0 ? undefined : { voice: p.marqueePhrases },
    founder: {
      quote: p.quote,
      attribution: p.quoteAttribution,
      eyebrow: orUndefined(s.about.kicker),
      heading: orUndefined(s.about.title),
      photo: { url: h.portraitUrl ?? undefined, alt: '' },
      aboutLabel: orUndefined(s.about.moreLabel),
      findUs: findUsFrom(s.markets, h.dates, w),
    },
    close: {
      label: s.close.kicker,
      headline: s.close.title,
      ctaLabel: s.close.moreLabel,
      ctaTarget: openTarget(s.close.moreTarget, h.linkTargets),
    },
    about: story.length === 0 ? undefined : { heading: s.about.pageTitle, story },
    contact: s.contact.title === '' && s.contact.lede === '' ? undefined : { heading: s.contact.title, intro: s.contact.lede },
  };
}

/** Read every home a family page needs. Testimonials and market dates only when
 *  the site has them switched on. */
export async function loadFamilyHomes(db: SupabaseClient<Database>, tenantId: string): Promise<FamilyHomes> {
  const [tenant, features, moment, sections, profile, portraitUrl] = await Promise.all([
    db.from('tenants').select('business_name').eq('id', tenantId).maybeSingle(),
    loadSiteFeatures(db, tenantId),
    getMoment(db, tenantId),
    getSiteSections(db, tenantId),
    getProfileForm(db, tenantId),
    getPortraitUrl(db, tenantId),
  ]);
  if (tenant.error !== null) throw new Error(`Could not load the site: ${tenant.error.message}`);
  if (tenant.data === null) throw new Error('Could not load the site: no such tenant');
  const [testimonials, dates, gallery] = await Promise.all([
    features.has('testimonials') ? listTestimonials(db, tenantId) : Promise.resolve([]),
    features.has('market_dates') ? listVisitorMarketDates(db, tenantId) : Promise.resolve([]),
    loadSiteGallery(db, tenantId, features),
  ]);
  return {
    name: tenant.data.business_name,
    sellsOnline: features.has('cart'),
    linkTargets: linkTargetsFor(features.has('catalog')),
    moment,
    sections,
    profile,
    portraitUrl,
    testimonials,
    dates,
    gallery,
  };
}

/** True when a page record still carries a family site's content (the old samples,
 *  kept as reference until the clean-up step). Every new family site keeps its
 *  content in the homes, and the database refuses new content in page records. */
export function holdsLegacyContent(content: unknown): boolean {
  return typeof content === 'object' && content !== null && 'moment' in content;
}
