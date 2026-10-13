/**
 * Section words (Modular Plan step 2): each section's own words for one site,
 * one row per section in `site_sections`. Every design reads its headings here,
 * so a site keeps its words when it changes design. The form holds plain
 * strings; an empty field means "not set". Validation turns the form into the
 * row and names the field that needs fixing.
 */
import { LINK_TARGETS, type LinkTarget } from '@/lib/archetypes/main-street/links';

/** The sections every design shares (mirrors the table's check). A design shows
 *  the ones it has, in its own order. */
export const SECTION_KEYS = ['work', 'collections', 'makes', 'about', 'reviews', 'markets', 'close', 'contact'] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export function isSectionKey(value: string): value is SectionKey {
  return (SECTION_KEYS as readonly string[]).includes(value);
}

/** What the owner sees each section called. */
export const SECTION_NAMES: Record<SectionKey, string> = {
  work: 'Your work',
  collections: 'Collections',
  makes: 'What you make',
  about: 'About you',
  reviews: 'What customers say',
  markets: 'Markets',
  close: 'The closing line',
  contact: 'Getting in touch',
};

export type SectionWords = {
  /** The short line above the heading. */
  kicker: string;
  title: string;
  /** The line under the heading. */
  lede: string;
  /** The section's link at the bottom ("See everything in the shop"), and where it goes. */
  moreLabel: string;
  moreTarget: LinkTarget | '';
  /** What the section says when it has nothing to show yet. */
  emptyText: string;
  /** The section's name in the site menu. */
  navLabel: string;
  /** The heading of the section's own page. */
  pageTitle: string;
};

export type SectionRow = {
  kicker: string | null;
  title: string | null;
  lede: string | null;
  more_label: string | null;
  more_target: string | null;
  empty_text: string | null;
  nav_label: string | null;
  page_title: string | null;
};

export type SiteSections = Record<SectionKey, SectionWords>;

export const SECTION_LIMITS = { kicker: 60, title: 160, lede: 600, moreLabel: 60, emptyText: 200, navLabel: 40, pageTitle: 160 } as const;

export const EMPTY_SECTION: SectionWords = {
  kicker: '',
  title: '',
  lede: '',
  moreLabel: '',
  moreTarget: '',
  emptyText: '',
  navLabel: '',
  pageTitle: '',
};

const LABELS: Record<keyof typeof SECTION_LIMITS, string> = {
  kicker: 'The short line above the heading',
  title: 'The heading',
  lede: 'The line under the heading',
  moreLabel: 'The link at the bottom',
  emptyText: 'The message for when there’s nothing to show',
  navLabel: 'The name in the menu',
  pageTitle: 'The page heading',
};

const orNull = (s: string): string | null => (s === '' ? null : s);
const oneLine = (s: string): string => s.trim().replace(/\s+/g, ' ');

function isLinkTarget(value: string): value is LinkTarget {
  return (LINK_TARGETS as readonly string[]).includes(value);
}

export function buildSectionRow(form: SectionWords): { ok: true; row: SectionRow } | { ok: false; error: string } {
  const t = {
    kicker: oneLine(form.kicker),
    title: oneLine(form.title),
    lede: oneLine(form.lede),
    moreLabel: oneLine(form.moreLabel),
    emptyText: oneLine(form.emptyText),
    navLabel: oneLine(form.navLabel),
    pageTitle: oneLine(form.pageTitle),
  };
  for (const key of Object.keys(SECTION_LIMITS) as (keyof typeof SECTION_LIMITS)[]) {
    if (t[key].length > SECTION_LIMITS[key]) {
      return { ok: false, error: `${LABELS[key]} is ${t[key].length} characters. Keep it to ${SECTION_LIMITS[key]}.` };
    }
  }
  const target = form.moreTarget;
  if (target !== '' && !isLinkTarget(target)) return { ok: false, error: 'Pick a page for the link to go to.' };
  if (t.moreLabel === '' && target !== '') return { ok: false, error: 'Add the link’s words, or clear where it goes.' };
  return {
    ok: true,
    row: {
      kicker: orNull(t.kicker),
      title: orNull(t.title),
      lede: orNull(t.lede),
      more_label: orNull(t.moreLabel),
      more_target: orNull(target),
      empty_text: orNull(t.emptyText),
      nav_label: orNull(t.navLabel),
      page_title: orNull(t.pageTitle),
    },
  };
}

export function sectionFromRow(row: SectionRow | null): SectionWords {
  if (row === null) return EMPTY_SECTION;
  const target = row.more_target ?? '';
  return {
    kicker: row.kicker ?? '',
    title: row.title ?? '',
    lede: row.lede ?? '',
    moreLabel: row.more_label ?? '',
    moreTarget: isLinkTarget(target) ? target : '',
    emptyText: row.empty_text ?? '',
    navLabel: row.nav_label ?? '',
    pageTitle: row.page_title ?? '',
  };
}

/** Every shared section, filled from the rows a site has (missing ones empty). */
export function sectionsFromRows(rows: readonly (SectionRow & { section: string })[]): SiteSections {
  const out = Object.fromEntries(SECTION_KEYS.map((k) => [k, EMPTY_SECTION])) as SiteSections;
  for (const row of rows) if (isSectionKey(row.section)) out[row.section] = sectionFromRow(row);
  return out;
}
