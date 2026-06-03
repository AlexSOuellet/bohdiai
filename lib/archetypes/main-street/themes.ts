/**
 * Main Street archetype — curated themes.
 *
 * Each theme is a complete designed package: a readable color pair, its OWN
 * type pairing, a spacing scale, a unifying photo grade, and motion. Bohdi
 * picks one by key; he cannot mix across themes — that is how the archetype
 * prevents the lost-color and unreadable-type failures by construction.
 *
 * Type is deliberately DIFFERENT per theme (and different from the Gallery,
 * which leads with Fraunces) — so the four themes read as four worlds, not one
 * pairing recolored. Paper is all-grotesk and quiet; Amber is a warm serif;
 * Field is a sturdy slab; Cobalt is geometric and assertive.
 *
 * Palettes map to Main Street's natural moods (Paper=SIMPLE, Amber=COZY,
 * Field=RUSTIC, Cobalt=MODERN). Palettes are STARTER values pending Alex's
 * design review and the eyes pass.
 */
import type { ArchetypeTheme, TypeRole } from '../types';

const MAIN_STREET_MOTION = {
  reveal: { duration: 800, stagger: 110, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
} as const;

const MAIN_STREET_SPACING = {
  hairline: 1,
  tight: 8,
  base: 16,
  loose: 32,
  section: 72,
  page: 96,
};

// Font stacks (with fallbacks). Each theme picks a display + a body.
const HANKEN = "'Hanken Grotesk', system-ui, sans-serif";
const NEWSREADER = "'Newsreader', Georgia, serif";
const NUNITO = "'Nunito Sans', system-ui, sans-serif";
const BITTER = "'Bitter', Georgia, serif";
const WORK_SANS = "'Work Sans', system-ui, sans-serif";
const SPACE_GROTESK = "'Space Grotesk', system-ui, sans-serif";
const INTER = "'Inter', system-ui, sans-serif";

/**
 * Build the 10-role type system from one theme's display + body pairing. The
 * SCALE (sizes, weights, hierarchy) is shared so every theme is well-set; only
 * the typefaces change per theme.
 */
function makeType(
  display: string,
  body: string,
  displayWeight = 600,
  displayVar?: string,
): Record<string, TypeRole> {
  const d = (extra: Partial<TypeRole>): TypeRole => ({
    family: display,
    weight: displayWeight,
    lineHeight: 1.12,
    ...(displayVar ? { variationSettings: displayVar } : {}),
    ...extra,
  } as TypeRole);
  return {
    wordmark: d({ size: 26, sizeMobile: 22, weight: 700, lineHeight: 1.0, letterSpacing: '-0.01em' }),
    heroHead: d({ size: 56, sizeMobile: 36, lineHeight: 1.05, letterSpacing: '-0.02em' }),
    makerHead: d({ size: 34, sizeMobile: 26, letterSpacing: '-0.015em' }),
    title: d({ size: 24, sizeMobile: 20, lineHeight: 1.15, letterSpacing: '-0.01em' }),
    tagline: { family: body, size: 14, sizeMobile: 13, weight: 400, lineHeight: 1.4 },
    nav: { family: body, size: 12, weight: 600, lineHeight: 1, letterSpacing: '0.12em', uppercase: true },
    label: { family: body, size: 11, weight: 700, lineHeight: 1, letterSpacing: '0.16em', uppercase: true },
    body: { family: body, size: 16, sizeMobile: 15, weight: 400, lineHeight: 1.6 },
    price: { family: body, size: 14, weight: 600, lineHeight: 1, letterSpacing: '0.01em' },
    caption: { family: body, size: 13, weight: 400, lineHeight: 1.5 },
  };
}

export const MAIN_STREET_THEMES: Record<string, ArchetypeTheme> = {
  'main-street-paper': {
    key: 'main-street-paper',
    label: 'Paper',
    palette: { bg: '#FBF8F2', fg: '#21201C', fgMuted: '#6A655C', accent: '#B5542F', rule: '#E7E0D4' },
    type: makeType(HANKEN, HANKEN, 700), // SIMPLE — all-grotesk, quiet
    spacing: MAIN_STREET_SPACING,
    atmosphere: { photoFilter: 'saturate(0.94) contrast(1.02) brightness(1.0)' },
    motion: MAIN_STREET_MOTION,
  },

  'main-street-amber': {
    key: 'main-street-amber',
    label: 'Amber',
    palette: { bg: '#F5ECDD', fg: '#2C2018', fgMuted: '#6E5A4B', accent: '#B06A2C', rule: '#E4D7C4' },
    type: makeType(NEWSREADER, NUNITO, 600, '"opsz" 60'), // COZY — warm serif
    spacing: MAIN_STREET_SPACING,
    atmosphere: { photoFilter: 'saturate(0.96) contrast(1.03) sepia(0.10) brightness(1.0)' },
    motion: MAIN_STREET_MOTION,
  },

  'main-street-field': {
    key: 'main-street-field',
    label: 'Field',
    palette: { bg: '#EEEAE0', fg: '#27261F', fgMuted: '#665F4F', accent: '#5E6B3B', rule: '#D9D3C3' },
    type: makeType(BITTER, WORK_SANS, 600), // RUSTIC — sturdy slab
    spacing: MAIN_STREET_SPACING,
    atmosphere: { photoFilter: 'saturate(0.9) contrast(1.02) sepia(0.08) brightness(1.0)' },
    motion: MAIN_STREET_MOTION,
  },

  'main-street-cobalt': {
    key: 'main-street-cobalt',
    label: 'Cobalt',
    palette: { bg: '#F4F4F2', fg: '#161618', fgMuted: '#5C5C60', accent: '#1F4FD6', rule: '#DEDEDC' },
    type: makeType(SPACE_GROTESK, INTER, 600), // MODERN — geometric grotesk
    spacing: MAIN_STREET_SPACING,
    atmosphere: { photoFilter: 'saturate(1.0) contrast(1.04) brightness(1.0)' },
    motion: MAIN_STREET_MOTION,
  },
};

/** Per-theme Google Fonts hrefs — each theme loads only its own pairing. */
export const MAIN_STREET_FONT_HREFS: Record<string, string> = {
  'main-street-paper':
    'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&display=swap',
  'main-street-amber':
    'https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600;6..72,700&family=Nunito+Sans:wght@400;600;700&display=swap',
  'main-street-field':
    'https://fonts.googleapis.com/css2?family=Bitter:wght@400;600;700&family=Work+Sans:wght@400;600;700&display=swap',
  'main-street-cobalt':
    'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap',
};

export type MainStreetThemeKey = keyof typeof MAIN_STREET_THEMES;
