/**
 * Broadsheet archetype — curated themes.
 *
 * Each theme is a complete, designed combination: a color pair that's guaranteed
 * to be readable, a type system with proper hierarchy, spacing scale, atmosphere,
 * and motion. Bohdi picks one of these by `key`. He cannot mix-and-match across
 * themes — that's how this archetype prevents the lost-color and unreadable-type
 * failures by construction.
 */
import type { ArchetypeTheme } from '../types';

const BROADSHEET_MOTION = {
  reveal: { duration: 900, stagger: 200, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
} as const;

const BROADSHEET_SPACING = {
  hairline: 1,
  tight: 8,
  base: 16,
  loose: 32,
  section: 48,
  page: 96,
};

/** Type pairing: a classical broadsheet — heavy condensed display, Didone subhead,
 *  warm text serif body, slab mono for marginalia. */
const CLASSICAL: Record<string, ArchetypeTheme['type'][string]> = {
  masthead: {
    family: "'Abril Fatface', 'Bodoni 72', Georgia, serif",
    size: 144,
    sizeMobile: 64,
    weight: 400,
    lineHeight: 0.9,
    letterSpacing: '-0.01em',
  },
  motto: {
    family: "'Bodoni Moda', Georgia, serif",
    size: 19,
    sizeMobile: 15,
    weight: 400,
    lineHeight: 1.35,
    letterSpacing: '0.02em',
    italic: true,
  },
  storyHead: {
    family: "'Bodoni Moda', Georgia, serif",
    size: 96,
    sizeMobile: 48,
    weight: 800,
    lineHeight: 0.95,
    letterSpacing: '-0.025em',
    variationSettings: '"opsz" 96',
  },
  sectionHead: {
    family: "'Bodoni Moda', Georgia, serif",
    size: 44,
    sizeMobile: 32,
    weight: 700,
    lineHeight: 1.05,
    letterSpacing: '-0.02em',
    italic: true,
    variationSettings: '"opsz" 44',
  },
  itemHead: {
    family: "'Bodoni Moda', Georgia, serif",
    size: 22,
    sizeMobile: 20,
    weight: 700,
    lineHeight: 1.15,
    letterSpacing: '0.04em',
    uppercase: true,
  },
  body: {
    family: "'Spectral', 'Iowan Old Style', Georgia, serif",
    size: 17,
    sizeMobile: 16,
    weight: 400,
    lineHeight: 1.58,
  },
  bodyEmphasis: {
    family: "'Spectral', 'Iowan Old Style', Georgia, serif",
    size: 20,
    sizeMobile: 17,
    weight: 400,
    lineHeight: 1.4,
    italic: true,
  },
  caption: {
    family: "'DM Mono', 'Courier New', monospace",
    size: 10,
    sizeMobile: 10,
    weight: 400,
    lineHeight: 1.3,
    letterSpacing: '0.18em',
    uppercase: true,
  },
  price: {
    family: "'DM Mono', 'Courier New', monospace",
    size: 18,
    sizeMobile: 17,
    weight: 500,
    lineHeight: 1,
    letterSpacing: '0.04em',
  },
};

export const BROADSHEET_THEMES: Record<string, ArchetypeTheme> = {
  'aged-newsprint': {
    key: 'aged-newsprint',
    label: 'Aged newsprint',
    palette: {
      bg: '#ECE1C6',
      fg: '#1A1612',
      fgMuted: '#4A3F33',
      accent: '#A82E1A',
      rule: '#1A1612',
    },
    type: CLASSICAL,
    spacing: BROADSHEET_SPACING,
    atmosphere: {
      grain:
        "background-image: url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.1 0 0 0 0 0.09 0 0 0 0 0.07 0 0 0 0.5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\"); opacity: 0.32; mix-blend-mode: multiply;",
      wash:
        'background: radial-gradient(ellipse at 30% 0%, rgba(168, 46, 26, 0.04), transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(45, 58, 38, 0.05), transparent 65%);',
      photoFilter: 'grayscale(0.55) contrast(1.18) sepia(0.18) brightness(0.96)',
    },
    motion: BROADSHEET_MOTION,
  },

  'kraft-paper': {
    key: 'kraft-paper',
    label: 'Kraft paper',
    palette: {
      bg: '#D7C29C',
      fg: '#1F140A',
      fgMuted: '#5A4128',
      accent: '#7A2410',
      rule: '#1F140A',
    },
    type: CLASSICAL,
    spacing: BROADSHEET_SPACING,
    atmosphere: {
      grain:
        "background-image: url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.12 0 0 0 0 0.08 0 0 0 0 0.04 0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\"); opacity: 0.42; mix-blend-mode: multiply;",
      photoFilter: 'grayscale(0.6) contrast(1.2) sepia(0.28) brightness(0.92)',
    },
    motion: BROADSHEET_MOTION,
  },

  'evening-print': {
    key: 'evening-print',
    label: 'Evening print',
    palette: {
      bg: '#1A1612',
      fg: '#ECE1C6',
      fgMuted: '#BFB29A',
      accent: '#E6A04A',
      rule: '#BFB29A',
    },
    type: CLASSICAL,
    spacing: BROADSHEET_SPACING,
    atmosphere: {
      grain:
        "background-image: url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.95 0 0 0 0 0.88 0 0 0 0 0.78 0 0 0 0.18 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\"); opacity: 0.5; mix-blend-mode: screen;",
      wash:
        'background: radial-gradient(ellipse at 30% 0%, rgba(230, 160, 74, 0.06), transparent 60%);',
      photoFilter: 'grayscale(0.4) contrast(1.1) brightness(0.85)',
    },
    motion: BROADSHEET_MOTION,
  },

  'cyan-ledger': {
    key: 'cyan-ledger',
    label: 'Cyan ledger',
    palette: {
      bg: '#E8E4D6',
      fg: '#0F2230',
      fgMuted: '#3C4F5C',
      accent: '#0E6F88',
      rule: '#0F2230',
    },
    type: CLASSICAL,
    spacing: BROADSHEET_SPACING,
    atmosphere: {
      grain:
        "background-image: url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.06 0 0 0 0 0.14 0 0 0 0 0.19 0 0 0 0.4 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\"); opacity: 0.28; mix-blend-mode: multiply;",
      photoFilter: 'grayscale(0.7) contrast(1.15) brightness(0.96)',
    },
    motion: BROADSHEET_MOTION,
  },
};

export type BroadsheetThemeKey = keyof typeof BROADSHEET_THEMES;
