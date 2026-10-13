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
import { getMoment } from '@/lib/backend/moment/queries';
import type { MomentView } from '@/lib/backend/moment/moment-form';
import { getSiteSections } from '@/lib/backend/sections/queries';
import type { SectionWords, SiteSections } from '@/lib/backend/sections/sections-form';
import { getPortraitUrl, getProfileForm } from '@/lib/backend/profile/queries';
import type { ProfileForm } from '@/lib/backend/profile/profile-form';
import { listTestimonials } from '@/lib/backend/testimonials/queries';
import type { Testimonial } from '@/lib/backend/testimonials/testimonial-form';
import { listMarketDates } from '@/lib/backend/dates/queries';
import type { MarketDate } from '@/lib/backend/dates/dates-form';
import { DATE_LOCALE, DEFAULT_COUNTS } from './defaults';
import type { MainStreetView } from './schemas';

/** Everything a family page reads, gathered from the homes. */
export type FamilyHomes = {
  name: string;
  /** Maker Full: the site sells online (the cart is on). */
  sellsOnline: boolean;
  moment: MomentView;
  sections: SiteSections;
  profile: ProfileForm;
  portraitUrl: string | null;
  testimonials: Testimonial[];
  dates: MarketDate[];
};

const orUndefined = (s: string): string | undefined => (s === '' ? undefined : s);

/** A market's day as a family page writes it: "Sat Oct 11", or a range. */
export function familyMarketDay(d: Pick<MarketDate, 'date' | 'endDate'>): string {
  const one = (date: string): string => {
    const parts = new Intl.DateTimeFormat(DATE_LOCALE, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).formatToParts(
      new Date(`${date}T00:00:00Z`),
    );
    const part = (type: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === type)?.value ?? '';
    return DEFAULT_COUNTS.marketDay(part('weekday'), part('month'), part('day'));
  };
  return d.endDate === '' ? one(d.date) : DEFAULT_COUNTS.marketRange(one(d.date), one(d.endDate));
}

type FindUs = NonNullable<MainStreetView['founder']['findUs']>;

function findUsFrom(markets: SectionWords, dates: readonly MarketDate[]): FindUs | undefined {
  if (dates.length === 0) return undefined;
  return {
    label: markets.title,
    title: orUndefined(markets.pageTitle),
    eventsLabel: orUndefined(markets.moreLabel),
    rows: dates.map((d) => ({
      day: familyMarketDay(d),
      where: DEFAULT_COUNTS.marketWhere(d.canceled ? DEFAULT_COUNTS.marketCanceled(d.name) : d.name, d.town),
      time: d.hours,
      date: d.date,
    })),
  };
}

/** Bio paragraphs: About you keeps them split by a blank line. */
function paragraphs(bio: string): string[] {
  return bio.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p !== '');
}

export function familyViewFromHomes(h: FamilyHomes): MainStreetView {
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
      ctaTarget: m.ctaTarget === '' ? undefined : m.ctaTarget,
      secondaryCtaLabel: orUndefined(m.secondCtaLabel),
      secondaryCtaTarget: m.secondCtaTarget === '' ? undefined : m.secondCtaTarget,
    },
    goods: { title: s.work.title, label: orUndefined(s.work.kicker), viewAllLabel: orUndefined(s.work.moreLabel) },
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
      findUs: findUsFrom(s.markets, h.dates),
    },
    close: {
      label: s.close.kicker,
      headline: s.close.title,
      ctaLabel: s.close.moreLabel,
      ctaTarget: s.close.moreTarget === '' ? undefined : s.close.moreTarget,
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
  const [testimonials, dates] = await Promise.all([
    features.has('testimonials') ? listTestimonials(db, tenantId) : Promise.resolve([]),
    features.has('market_dates') ? listMarketDates(db, tenantId) : Promise.resolve([]),
  ]);
  return {
    name: tenant.data.business_name,
    sellsOnline: features.has('cart'),
    moment,
    sections,
    profile,
    portraitUrl,
    testimonials,
    dates,
  };
}

/** True when a page record still carries a family site's content (the old samples,
 *  kept as reference until the clean-up step). Every new family site keeps its
 *  content in the homes, and the database refuses new content in page records. */
export function holdsLegacyContent(content: unknown): boolean {
  return typeof content === 'object' && content !== null && 'moment' in content;
}
