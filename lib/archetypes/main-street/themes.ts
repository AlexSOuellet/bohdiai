/**
 * Main Street archetype — curated themes.
 *
 * Built fresh off the archetype contract — NOT carried over from another
 * archetype. Each theme is a complete designed world: a dominant color with a
 * sharp accent (not timid near-white), its OWN characterful type pairing, a
 * spacing scale, a paper grain, a photo grade, and motion. Bohdi picks one by
 * key; he cannot mix across themes.
 *
 * The aesthetic is a warm, crafted storefront with editorial confidence — type
 * set with conviction, framed imagery, a keyline frame like a shop window. The
 * four themes are four moods of that idea, deliberately distinct so two shops
 * never read as one pairing recolored.
 *
 * Palettes are STARTER values pending Alex's review.
 */
import type { ArchetypeTheme, TypeRole } from '../types';

const MOTION = {
  // Slow and deliberate — the brand's motion rule, not a quick pop.
  reveal: { duration: 1000, stagger: 130, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
} as const;

const SPACING = { hairline: 1, tight: 8, base: 16, loose: 32, section: 88, page: 112 };

// Subtle paper grain shared as a TECHNIQUE (low opacity), tuned per theme below.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const FONT = {
  young: "'Young Serif', Georgia, serif",
  hanken: "'Hanken Grotesk', system-ui, sans-serif",
  bitter: "'Bitter', Georgia, serif",
  work: "'Work Sans', system-ui, sans-serif",
  bricolage: "'Bricolage Grotesque', system-ui, sans-serif",
  inter: "'Inter', system-ui, sans-serif",
};

/**
 * Build the 10-role type system from one theme's display + body pairing. The
 * SCALE is shared so every theme is well-set; the typefaces change per theme.
 * Display roles are deliberately LARGE — conviction, not a corner logo.
 */
function makeType(display: string, body: string, displayWeight = 400): Record<string, TypeRole> {
  const d = (size: number, sizeMobile: number, ls: string, lh: number): TypeRole => ({
    family: display,
    size,
    sizeMobile,
    weight: displayWeight,
    lineHeight: lh,
    letterSpacing: ls,
  });
  return {
    wordmark: d(30, 24, '-0.01em', 1.0),
    heroHead: d(92, 46, '-0.015em', 0.96),
    makerHead: d(42, 30, '-0.01em', 1.06),
    title: d(34, 26, '-0.01em', 1.05),
    sectionNo: { family: body, size: 13, weight: 700, lineHeight: 1, letterSpacing: '0.16em', uppercase: true },
    tagline: { family: body, size: 14, sizeMobile: 13, weight: 500, lineHeight: 1.4 },
    nav: { family: body, size: 12, weight: 600, lineHeight: 1, letterSpacing: '0.16em', uppercase: true },
    label: { family: body, size: 12, weight: 700, lineHeight: 1, letterSpacing: '0.22em', uppercase: true },
    body: { family: body, size: 17, sizeMobile: 15, weight: 400, lineHeight: 1.58 },
    price: { family: body, size: 14, weight: 700, lineHeight: 1, letterSpacing: '0.01em' },
    caption: { family: body, size: 14, weight: 400, lineHeight: 1.5 },
  };
}

export const MAIN_STREET_THEMES: Record<string, ArchetypeTheme> = {
  // COZY — the warm crafted storefront (the lead direction)
  'main-street-hearth': {
    key: 'main-street-hearth',
    label: 'Hearth',
    palette: { bg: '#EAD7AE', fg: '#2A1E12', fgMuted: '#6E5A3E', accent: '#C2491F', rule: '#D3BD92' },
    type: makeType(FONT.young, FONT.hanken),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(0.97) contrast(1.03) sepia(0.08)' },
    motion: MOTION,
  },

  // SIMPLE — restrained, confident, a calm green accent
  'main-street-linen': {
    key: 'main-street-linen',
    label: 'Linen',
    palette: { bg: '#DCE0D6', fg: '#1E211C', fgMuted: '#5E6358', accent: '#3D6B53', rule: '#C6CCBC' },
    type: makeType(FONT.hanken, FONT.hanken, 800),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(0.95) contrast(1.03)' },
    motion: MOTION,
  },

  // RUSTIC — earthy, sturdy slab, ochre
  'main-street-field': {
    key: 'main-street-field',
    label: 'Field',
    palette: { bg: '#D9D3B8', fg: '#232318', fgMuted: '#5F5C44', accent: '#8A5A24', rule: '#C2BB98' },
    type: makeType(FONT.bitter, FONT.work, 700),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(0.92) contrast(1.02) sepia(0.06)' },
    motion: MOTION,
  },

  // MODERN — crisp, geometric display, a confident blue
  'main-street-press': {
    key: 'main-street-press',
    label: 'Press',
    palette: { bg: '#DEE2E4', fg: '#15171A', fgMuted: '#565B61', accent: '#2D5BD0', rule: '#C5CBD0' },
    type: makeType(FONT.bricolage, FONT.inter, 800),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(1.02) contrast(1.05)' },
    motion: MOTION,
  },
};

/** Per-theme Google Fonts hrefs — each theme loads only its own pairing. */
export const MAIN_STREET_FONT_HREFS: Record<string, string> = {
  'main-street-hearth':
    'https://fonts.googleapis.com/css2?family=Young+Serif&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap',
  'main-street-linen':
    'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800;900&display=swap',
  'main-street-field':
    'https://fonts.googleapis.com/css2?family=Bitter:wght@400;600;700;800&family=Work+Sans:wght@400;500;600;700&display=swap',
  'main-street-press':
    'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Inter:wght@400;500;600;700&display=swap',
};

export type MainStreetThemeKey = keyof typeof MAIN_STREET_THEMES;
