/**
 * Normalize the Copywriter's parsed output. The schema now validates SHAPE only
 * (right fields, right types, right enums) and lets any length through — D53,
 * sharpened: a build never fails on copy, on ANY field. The cleanup that used to
 * live as REJECTING refine rules (headline punctuation, story-line punctuation,
 * slug format) lives here as ACCEPTING transforms — strip the bad characters,
 * don't throw. The maker can still write whatever they want post-build; this
 * just keeps Bohdi's first draft consistent with the page's typographic
 * intent without ever blocking the build.
 */
import type { CopywriterDraft } from './copywriter-schema';

/** Strip sentence-terminal punctuation from a headline-style field. Internal
 *  commas and intra-word hyphens stay (they read fine in a phrase). Periods,
 *  exclamation points, question marks, and trailing terminal marks come off. */
function stripHeadlinePunct(s: string): string {
  // Drop all .!? wherever they appear, then drop any trailing :;,–— and dashes.
  return s.replace(/[.!?]+/g, '').replace(/[:;,–—-]+\s*$/u, '').trim();
}

/** Strip ALL punctuation we forbid in a story line. The lines cross-fade large;
 *  marks read as smears. Apostrophes and intra-word hyphens stay. */
function stripStoryPunct(s: string): string {
  // Remove forbidden marks anywhere, normalize ellipses, trim ends.
  return s.replace(/[.,!?;:…–—"“”]+/g, '').trim();
}

/** Slugify a string: lowercase, replace non-alphanumeric runs with single
 *  hyphens, trim leading/trailing hyphens. Caps the result soft-long (no hard
 *  fail) so the URL stays sane even if the model produced something verbose. */
export function slugify(s: string): string {
  const normalized = s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized.length > 80 ? normalized.slice(0, 80).replace(/-+$/, '') : normalized;
}

/** Apply post-parse normalization to a Copywriter draft. Returns a new draft;
 *  does not mutate. Never throws — turns every quality rule into an absorbing
 *  transform so the build moves forward. */
export function normalizeCopy(d: CopywriterDraft): CopywriterDraft {
  const trim = (s: string): string => s.trim();
  return {
    ...d,
    shopName: trim(d.shopName),
    identity: {
      ...d.identity,
      wordmark: trim(d.identity.wordmark),
      nav: d.identity.nav.map((n) => ({ label: trim(n.label), target: n.target })),
    },
    moment: {
      ...d.moment,
      story: d.moment.story.map(stripStoryPunct).filter((s) => s.length > 0),
      eyebrow: trim(d.moment.eyebrow),
      brand: trim(d.moment.brand),
      ctaLabel: trim(d.moment.ctaLabel),
      ctaTarget: d.moment.ctaTarget,
      ...(d.moment.secondaryCtaLabel !== undefined ? { secondaryCtaLabel: trim(d.moment.secondaryCtaLabel) } : {}),
      ...(d.moment.secondaryCtaTarget !== undefined ? { secondaryCtaTarget: d.moment.secondaryCtaTarget } : {}),
    },
    goods: {
      ...d.goods,
      title: stripHeadlinePunct(d.goods.title),
      ...(d.goods.label !== undefined ? { label: trim(d.goods.label) } : {}),
      ...(d.goods.viewAllLabel !== undefined ? { viewAllLabel: trim(d.goods.viewAllLabel) } : {}),
    },
    founder: {
      ...d.founder,
      quote: trim(d.founder.quote),
      attribution: trim(d.founder.attribution),
      ...(d.founder.eyebrow !== undefined ? { eyebrow: trim(d.founder.eyebrow) } : {}),
      ...(d.founder.heading !== undefined ? { heading: stripHeadlinePunct(d.founder.heading) } : {}),
      ...(d.founder.aboutLabel !== undefined ? { aboutLabel: trim(d.founder.aboutLabel) } : {}),
      ...(d.founder.findUs !== undefined
        ? {
            findUs: {
              ...d.founder.findUs,
              label: trim(d.founder.findUs.label),
              ...(d.founder.findUs.eventsLabel !== undefined ? { eventsLabel: trim(d.founder.findUs.eventsLabel) } : {}),
              rows: d.founder.findUs.rows.map((r) => ({ day: trim(r.day), where: trim(r.where), time: trim(r.time) })),
            },
          }
        : {}),
    },
    close: {
      ...d.close,
      label: trim(d.close.label),
      headline: stripHeadlinePunct(d.close.headline),
      ctaLabel: trim(d.close.ctaLabel),
    },
    about: {
      ...d.about,
      heading: stripHeadlinePunct(d.about.heading),
      story: d.about.story.map(trim),
    },
    contact: {
      ...d.contact,
      heading: stripHeadlinePunct(d.contact.heading),
      intro: trim(d.contact.intro),
    },
    products: d.products.map((p) => ({
      ...p,
      name: trim(p.name),
      slug: slugify(p.slug),
      shortDescription: trim(p.shortDescription),
      description: trim(p.description),
    })),
  };
}
