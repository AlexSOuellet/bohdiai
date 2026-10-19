/**
 * The reverse of from-homes: an old family page record's content, sorted into
 * the homes it belongs in (Modular Plan). Used to copy a sample onto a fresh site
 * that keeps its content properly, so the two can be compared side by side, and
 * later to move the sites that will be real. Every piece goes through the same
 * checks the owner's own saves do.
 *
 * Photos and videos come back as web addresses; the caller records each as an
 * upload. Market rows without a real date can't become markets and are returned
 * separately so the caller can say so.
 */
import { buildMomentRow, EMPTY_MOMENT, type MomentForm, type MomentRow } from '@/lib/backend/moment/moment-form';
import { buildSectionRow, EMPTY_SECTION, type SectionKey, type SectionRow, type SectionWords } from '@/lib/backend/sections/sections-form';
import { buildProfileHomes, EMPTY_PROFILE, type ProfileHomes } from '@/lib/backend/profile/profile-form';
import { isCalendarDate } from '@/lib/backend/dates/dates-form';
import type { MainStreetView } from './schemas';

export type LegacyHomes = {
  moment: MomentRow;
  /** The moment's photo or video, its poster, and its extra photos, as addresses. */
  momentMediaUrl: string | null;
  momentPosterUrl: string | null;
  momentPhotoUrls: { url: string; alt: string }[];
  sections: Partial<Record<SectionKey, SectionRow>>;
  profile: ProfileHomes;
  portraitUrl: string | null;
  testimonials: { quote: string; name: string; detail: string | null }[];
  markets: { date: string; name: string; hours: string }[];
  /** Market rows written as free text ("Saturdays") with no date to place them. */
  undatedMarkets: string[];
};

const opt = (s: string | undefined): string => s ?? '';

function section(words: Partial<SectionWords>, key: SectionKey): SectionRow | null {
  const form = { ...EMPTY_SECTION, ...words };
  if (Object.values(form).every((v) => v === '')) return null;
  const built = buildSectionRow(form);
  if (!built.ok) throw new Error(`The ${key} section’s words don’t fit: ${built.error}`);
  return built.row;
}

export function homesFromLegacy(c: MainStreetView): LegacyHomes {
  const m = c.moment;
  const momentForm: MomentForm = {
    ...EMPTY_MOMENT,
    kicker: m.eyebrow,
    headline: m.brand,
    sub: opt(m.sub),
    story: m.story,
    ctaLabel: m.ctaLabel,
    ctaTarget: m.ctaTarget ?? (m.ctaLabel === '' ? '' : 'shop'),
    secondCtaLabel: opt(m.secondaryCtaLabel),
    secondCtaTarget: m.secondaryCtaTarget ?? (m.secondaryCtaLabel === undefined ? '' : 'shop'),
    playMode: m.playMode ?? (m.playIntro === false ? 'off' : 'once'),
  };
  const moment = buildMomentRow(momentForm);
  if (!moment.ok) throw new Error(`The moment’s words don’t fit: ${moment.error}`);

  const f = c.founder;
  const findUs = f.findUs;
  const sections: Partial<Record<SectionKey, SectionRow>> = {};
  const put = (key: SectionKey, words: Partial<SectionWords>): void => {
    const row = section(words, key);
    if (row !== null) sections[key] = row;
  };
  put('work', { kicker: opt(c.goods.label), title: c.goods.title, moreLabel: opt(c.goods.viewAllLabel) });
  if (c.collections !== undefined) put('collections', { kicker: opt(c.collections.label), title: c.collections.title, moreLabel: opt(c.collections.viewAllLabel) });
  put('about', { kicker: opt(f.eyebrow), title: opt(f.heading), moreLabel: opt(f.aboutLabel), pageTitle: opt(c.about?.heading) });
  if (c.reviews !== undefined) put('reviews', { kicker: opt(c.reviews.label), title: c.reviews.title, moreLabel: opt(c.reviews.viewAllLabel) });
  if (findUs !== undefined) put('markets', { title: findUs.label, pageTitle: opt(findUs.title), moreLabel: opt(findUs.eventsLabel) });
  put('close', { kicker: c.close.label, title: c.close.headline, moreLabel: c.close.ctaLabel, moreTarget: c.close.ctaTarget ?? (c.close.ctaLabel === '' ? '' : 'shop') });
  if (c.contact !== undefined) put('contact', { title: c.contact.heading, lede: c.contact.intro });

  const profile = buildProfileHomes({
    ...EMPTY_PROFILE,
    bio: (c.about?.story ?? []).join('\n\n'),
    quote: f.quote,
    quoteAttribution: f.attribution,
    marqueePhrases: c.marquee?.voice ?? [],
  });
  if (!profile.ok) throw new Error(`About you doesn’t fit: ${profile.error}`);

  const rows = findUs?.rows ?? [];
  const dated = rows.filter((r) => r.date !== undefined && isCalendarDate(r.date));
  return {
    moment: moment.row,
    momentMediaUrl: m.media.url ?? null,
    momentPosterUrl: m.media.poster ?? null,
    momentPhotoUrls: (m.collageShots ?? []).flatMap((s) => (s.url === undefined || s.url === '' ? [] : [{ url: s.url, alt: s.alt }])),
    sections,
    profile: profile.homes,
    portraitUrl: f.photo.url ?? null,
    testimonials: (c.reviews?.items ?? []).map((t) => ({ quote: t.quote, name: t.author, detail: t.location ?? null })),
    markets: dated.map((r) => ({ date: r.date ?? '', name: r.where, hours: r.time })),
    undatedMarkets: rows.filter((r) => !dated.includes(r)).map((r) => `${r.day} · ${r.where} · ${r.time}`),
  };
}
