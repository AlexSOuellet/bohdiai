/**
 * Main Street — the family registry.
 *
 * A family is Bohdi's INTERNAL word for what the maker picks as a "mood." Six
 * families total: Cozy, Rustic, Dark, Luxury, Cheerful, Modern. Each entry here
 * carries everything the renderer needs to paint a store: which variant to use
 * for every section, what order the sections appear in, the type package, the
 * palette, texture, wallpaper, imagery grade, and the Google Fonts URL.
 *
 * Sources of truth:
 *   - Section variant picks per family — `tmp/mockups/defaults-matrix.html`
 *   - Section stack order + on/off per family — `tmp/mockups/family-stacks-v2.html`
 *   - Style defaults (palette / type package / texture / wallpaper / imagery) —
 *     `Project-Docs/Family-Style-Sheets.md`
 *
 * Rules locked in Session 65:
 *   - Mood is the public word; family is the internal word. Both name the same
 *     concept. The DB column stays `mood_key`.
 *   - Every family ships all eight content sections at onboarding. On/off is a
 *     maker-controlled editor toggle later — NOT a family default. The one
 *     exception is Contact, which shows as off because its home-block isn't
 *     built yet; it flips on once built.
 *   - "Elegant" is the public mood label; internally we call it "Luxury."
 *   - "Industrial" retires. Any tenant with mood_key='industrial' resolves to
 *     Modern (its closest shelf neighbor). No tenants currently carry it —
 *     a defensive migration + MoodKey type update land in a follow-up.
 */
import type { HeroVariantKey } from './hero-catalog';
import type { GoodsTreatment } from './goods';
import type { CollectionsTreatment } from './collections';
import type { ReviewsTreatment } from './reviews';
import type { FindUsTreatment } from './findus';
import type { FounderTreatment } from './founder';
import type { NavVariant } from './schemas';
import type { MoodKey } from '../../moods';
import { REFERENCE_LABELS } from './defaults';

export const FAMILY_KEYS = ['cozy', 'rustic', 'dark', 'luxury', 'cheerful', 'modern'] as const;
export type FamilyKey = (typeof FAMILY_KEYS)[number];

/** The nine positions in every family's home page.
 *  `founder` is the About-the-maker beat (kept as `founder` to match the
 *  existing renderer + content schema — the section's public label is "About"). */
export const SECTION_KEYS = [
  'hero',
  'founder',
  'goods',
  'collections',
  'reviews',
  'findUs',
  'marquee',
  'contact',
  'close',
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export interface FamilySectionStackEntry {
  section: SectionKey;
  on: boolean;
  /** Marks the "opens-with" lead — the section right after Hero that gives the
   *  family its shopper-feel. Exactly one entry per family carries this. */
  lead?: boolean;
  /** True when the section's home block isn't built yet. Currently only
   *  `contact` — every other section is on across every family. */
  notBuilt?: boolean;
}

export interface FamilyPalette {
  /** Human name for the palette combination (e.g. "Cream & Ember"). */
  name: string;
  bg: string;
  fg: string;
  muted: string;
  accent: string;
}

export interface FamilyTypePackage {
  /** Human name for the default package (e.g. "The Journal"). */
  name: string;
  header: string;
  body: string;
  label: string;
  accent: string;
}

export interface FamilySectionDefaults {
  hero: HeroVariantKey;
  goods: GoodsTreatment;
  collections: CollectionsTreatment;
  reviews: ReviewsTreatment;
  founder: FounderTreatment;
  nav: NavVariant;
  findUs: FindUsTreatment;
}

export interface Family {
  key: FamilyKey;
  /** How this family shows up in maker copy. Always a mood word — never "family". */
  publicMoodLabel: string;
  sectionDefaults: FamilySectionDefaults;
  sectionStack: readonly FamilySectionStackEntry[];
  typePackage: FamilyTypePackage;
  palette: FamilyPalette;
  texture: string;
  wallpaper: string;
  imageryGrade: string;
  /** Google Fonts stylesheet URL preloaded on the storefront. */
  fontHref: string;
  /** The skin the family PAINTS THROUGH at onboarding — the ★ pick from
   *  Family-Style-Sheets whose palette best represents the family. Maker can
   *  swap to another within-family skin from the editor (Phase 3). Every skin
   *  in the catalog stays reachable via `moodAlignedSkins`; the default is
   *  the family's own opinion. (§1.6) */
  defaultSkin: string;
}

const on = (section: SectionKey, extras: { lead?: boolean } = {}): FamilySectionStackEntry => ({
  section,
  on: true,
  ...(extras.lead === true ? { lead: true } : {}),
});
const off = (section: SectionKey, extras: { notBuilt?: boolean } = {}): FamilySectionStackEntry => ({
  section,
  on: false,
  ...(extras.notBuilt === true ? { notBuilt: true } : {}),
});
const contactOff = off('contact', { notBuilt: true });

const COZY: Family = {
  key: 'cozy',
  publicMoodLabel: REFERENCE_LABELS.moods.labels.cozy,
  sectionDefaults: {
    hero: 'story',
    goods: 'procession',
    collections: 'cupboard',
    reviews: 'guestbook',
    founder: 'letter',
    nav: 'standard',
    findUs: 'poster',
  },
  sectionStack: [
    on('hero'),
    on('founder', { lead: true }),
    on('goods'),
    on('collections'),
    on('reviews'),
    on('findUs'),
    on('marquee'),
    contactOff,
    on('close'),
  ],
  typePackage: {
    name: REFERENCE_LABELS.families.typePackages.cozy,
    header: 'Fraunces',
    body: 'Newsreader',
    label: 'IBM Plex Mono',
    accent: 'Pinyon Script',
  },
  palette: { name: REFERENCE_LABELS.families.palettes.cozy, bg: '#F4EAD7', fg: '#2B1A12', muted: '#7A6249', accent: '#C8431B' },
  texture: REFERENCE_LABELS.families.textures.cozy,
  wallpaper: REFERENCE_LABELS.families.wallpapers.cozy,
  imageryGrade: REFERENCE_LABELS.families.imageryGrades.cozy,
  fontHref:
    'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Newsreader:ital,wght@0,400;0,500;1,400&family=IBM+Plex+Mono:wght@400;500&family=Pinyon+Script&display=swap',
  defaultSkin: 'main-street-ember',
};

const RUSTIC: Family = {
  key: 'rustic',
  publicMoodLabel: REFERENCE_LABELS.moods.labels.rustic,
  sectionDefaults: {
    hero: 'stacked',
    goods: 'marquee',
    collections: 'crates',
    reviews: 'guestbook',
    founder: 'workbench',
    nav: 'standard',
    findUs: 'itinerary',
  },
  sectionStack: [
    on('hero'),
    on('marquee'),
    on('founder', { lead: true }),
    on('goods'),
    on('findUs'),
    on('collections'),
    on('reviews'),
    contactOff,
    on('close'),
  ],
  typePackage: {
    name: REFERENCE_LABELS.families.typePackages.rustic,
    header: 'Alfa Slab One',
    body: 'Bitter',
    label: 'Cutive Mono',
    accent: 'Permanent Marker',
  },
  palette: { name: REFERENCE_LABELS.families.palettes.rustic, bg: '#2E2114', fg: '#E6D8BE', muted: '#9C8A6C', accent: '#B5491F' },
  texture: REFERENCE_LABELS.families.textures.rustic,
  wallpaper: REFERENCE_LABELS.families.wallpapers.rustic,
  imageryGrade: REFERENCE_LABELS.families.imageryGrades.rustic,
  fontHref:
    'https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Bitter:wght@400;600;800&family=Cutive+Mono&family=Permanent+Marker&display=swap',
  defaultSkin: 'main-street-tannery',
};

const DARK: Family = {
  key: 'dark',
  publicMoodLabel: REFERENCE_LABELS.moods.labels.dark,
  sectionDefaults: {
    hero: 'floating-card',
    goods: 'slideshow',
    collections: 'portals',
    reviews: 'pull-quote',
    founder: 'portrait',
    nav: 'menu-reveal',
    findUs: 'next-stop',
  },
  sectionStack: [
    on('hero'),
    on('goods', { lead: true }),
    on('founder'),
    on('collections'),
    on('reviews'),
    on('findUs'),
    on('marquee'),
    contactOff,
    on('close'),
  ],
  typePackage: {
    name: REFERENCE_LABELS.families.typePackages.dark,
    header: 'Gloock',
    body: 'Spectral',
    label: 'Syne',
    accent: 'Cinzel',
  },
  palette: { name: REFERENCE_LABELS.families.palettes.dark, bg: '#14100C', fg: '#E8DCC8', muted: '#9A8A72', accent: '#C9772F' },
  texture: REFERENCE_LABELS.families.textures.dark,
  wallpaper: REFERENCE_LABELS.families.wallpapers.dark,
  imageryGrade: REFERENCE_LABELS.families.imageryGrades.dark,
  fontHref:
    'https://fonts.googleapis.com/css2?family=Gloock&family=Spectral:ital,wght@0,400;0,500;1,400&family=Syne:wght@500;600;700&family=Cinzel:wght@500;600&display=swap',
  defaultSkin: 'main-street-hearthstone',
};

const LUXURY: Family = {
  key: 'luxury',
  publicMoodLabel: REFERENCE_LABELS.moods.labels.elegant,
  sectionDefaults: {
    hero: 'typographic',
    goods: 'switcher',
    collections: 'chapters',
    reviews: 'pull-quote',
    founder: 'editorial',
    nav: 'split-center',
    findUs: 'board',
  },
  sectionStack: [
    on('hero'),
    on('collections', { lead: true }),
    on('goods'),
    on('reviews'),
    on('founder'),
    on('findUs'),
    on('marquee'),
    contactOff,
    on('close'),
  ],
  typePackage: {
    name: REFERENCE_LABELS.families.typePackages.luxury,
    header: 'Playfair Display',
    body: 'Cormorant Garamond',
    label: 'Tenor Sans',
    accent: 'Cinzel Decorative',
  },
  palette: { name: REFERENCE_LABELS.families.palettes.luxury, bg: '#F4F1EB', fg: '#1A1714', muted: '#8A8270', accent: '#9C7B3A' },
  texture: REFERENCE_LABELS.families.textures.luxury,
  wallpaper: REFERENCE_LABELS.families.wallpapers.luxury,
  imageryGrade: REFERENCE_LABELS.families.imageryGrades.luxury,
  fontHref:
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Tenor+Sans&family=Cinzel+Decorative:wght@600;700&display=swap',
  defaultSkin: 'main-street-atelier',
};

const CHEERFUL: Family = {
  key: 'cheerful',
  publicMoodLabel: REFERENCE_LABELS.moods.labels.cheerful,
  sectionDefaults: {
    hero: 'collage',
    goods: 'table',
    collections: 'lanes',
    reviews: 'texts',
    founder: 'card',
    nav: 'cta-forward',
    findUs: 'passes',
  },
  sectionStack: [
    on('hero'),
    on('marquee', { lead: true }),
    on('goods'),
    on('reviews'),
    on('collections'),
    on('founder'),
    on('findUs'),
    contactOff,
    on('close'),
  ],
  typePackage: {
    name: REFERENCE_LABELS.families.typePackages.cheerful,
    header: 'Fredoka',
    body: 'Nunito',
    label: 'DM Mono',
    accent: 'Lilita One',
  },
  palette: { name: REFERENCE_LABELS.families.palettes.cheerful, bg: '#FCEFD6', fg: '#20223A', muted: '#6C4AB6', accent: '#FB4D3D' },
  texture: REFERENCE_LABELS.families.textures.cheerful,
  wallpaper: REFERENCE_LABELS.families.wallpapers.cheerful,
  imageryGrade: REFERENCE_LABELS.families.imageryGrades.cheerful,
  fontHref:
    'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600&family=Nunito:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Lilita+One&display=swap',
  defaultSkin: 'main-street-confetti',
};

const MODERN: Family = {
  key: 'modern',
  publicMoodLabel: REFERENCE_LABELS.moods.labels.modern,
  sectionDefaults: {
    hero: 'split',
    goods: 'module',
    collections: 'cascade',
    reviews: 'rating',
    founder: 'signature',
    nav: 'split-center',
    findUs: 'calendar',
  },
  sectionStack: [
    on('hero'),
    on('goods', { lead: true }),
    on('marquee'),
    on('collections'),
    on('founder'),
    on('reviews'),
    on('findUs'),
    contactOff,
    on('close'),
  ],
  typePackage: {
    name: REFERENCE_LABELS.families.typePackages.modern,
    header: 'Archivo',
    body: 'Manrope',
    label: 'JetBrains Mono',
    accent: 'Saira Condensed',
  },
  palette: { name: REFERENCE_LABELS.families.palettes.modern, bg: '#FAFAF8', fg: '#111110', muted: '#7D7D78', accent: '#E5341B' },
  texture: REFERENCE_LABELS.families.textures.modern,
  wallpaper: REFERENCE_LABELS.families.wallpapers.modern,
  imageryGrade: REFERENCE_LABELS.families.imageryGrades.modern,
  fontHref:
    'https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Saira+Condensed:wght@600;700&display=swap',
  defaultSkin: 'main-street-studio',
};

export const FAMILIES: Record<FamilyKey, Family> = {
  cozy: COZY,
  rustic: RUSTIC,
  dark: DARK,
  luxury: LUXURY,
  cheerful: CHEERFUL,
  modern: MODERN,
};

/**
 * Resolve a tenant's stored `mood_key` to its Family. Accepts loose input
 * (string | null | undefined) so callers reading from the DB or an envelope
 * don't have to pre-validate — legacy tenants with missing / unknown values
 * fall back safely to Cozy. Handles the public/internal naming split:
 *   - `elegant` (public mood) → Luxury (internal family)
 *   - `industrial` (retired mood) → Modern (nearest shelf neighbor)
 *   - null / undefined / unknown string → Cozy (safe default)
 */
export function getFamily(mood: string | null | undefined): Family {
  if (mood === 'elegant') return FAMILIES.luxury;
  if (mood === 'industrial') return FAMILIES.modern;
  if (mood !== null && mood !== undefined && (mood in FAMILIES)) {
    return FAMILIES[mood as FamilyKey];
  }
  return FAMILIES.cozy;
}

/** Consumer-visible convenience — MoodKey callers get the same behavior. Used
 *  by places that already validated the input against MoodKey.  */
export type { MoodKey };
