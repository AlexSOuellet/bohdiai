/**
 * Gallery archetype — curated themes.
 *
 * Each theme is a complete, designed combination: a color pair guaranteed to
 * be readable, a type system with proper hierarchy, a spacing scale, the
 * unifying photo grade that pulls mismatched images into one set, and motion.
 * Bohdi picks one of these by `key`. He cannot mix across themes — that's how
 * this archetype prevents the lost-color and unreadable-type failures by
 * construction. The same shared type pairing carries every theme today;
 * additional pairings would be added per-theme later.
 */
import type { ArchetypeTheme } from '../types';

const GALLERY_MOTION = {
  reveal: { duration: 800, stagger: 120, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
} as const;

const GALLERY_SPACING = {
  hairline: 1,
  tight: 8,
  base: 16,
  loose: 32,
  section: 64,
  page: 96,
};

/** Type pairing: a modern gallery — characterful optical serif display
 *  (Fraunces), clean grotesque body (Archivo), mono for prices. */
const GALLERY_TYPE: Record<string, ArchetypeTheme['type'][string]> = {
  wordmark: {
    family: "'Fraunces', Georgia, serif",
    size: 42,
    sizeMobile: 30,
    weight: 900,
    lineHeight: 1.0,
    letterSpacing: '-0.025em',
    variationSettings: '"opsz" 144',
  },
  tagline: {
    family: "'Fraunces', Georgia, serif",
    size: 16,
    sizeMobile: 14,
    weight: 400,
    lineHeight: 1.4,
    italic: true,
  },
  nav: {
    family: "'Archivo', system-ui, sans-serif",
    size: 11,
    sizeMobile: 11,
    weight: 500,
    lineHeight: 1,
    letterSpacing: '0.2em',
    uppercase: true,
  },
  label: {
    family: "'Archivo', system-ui, sans-serif",
    size: 10,
    sizeMobile: 10,
    weight: 600,
    lineHeight: 1,
    letterSpacing: '0.24em',
    uppercase: true,
  },
  title: {
    family: "'Fraunces', Georgia, serif",
    size: 28,
    sizeMobile: 22,
    weight: 600,
    lineHeight: 1.1,
    letterSpacing: '-0.01em',
    variationSettings: '"opsz" 72',
  },
  makerHead: {
    family: "'Fraunces', Georgia, serif",
    size: 36,
    sizeMobile: 26,
    weight: 600,
    lineHeight: 1.12,
    letterSpacing: '-0.015em',
    variationSettings: '"opsz" 96',
  },
  body: {
    family: "'Archivo', system-ui, sans-serif",
    size: 15,
    sizeMobile: 14,
    weight: 400,
    lineHeight: 1.62,
  },
  price: {
    family: "'DM Mono', 'Courier New', monospace",
    size: 12,
    sizeMobile: 12,
    weight: 500,
    lineHeight: 1,
    letterSpacing: '0.02em',
  },
  caption: {
    family: "'Archivo', system-ui, sans-serif",
    size: 12,
    sizeMobile: 12,
    weight: 400,
    lineHeight: 1.5,
  },
};

export const GALLERY_THEMES: Record<string, ArchetypeTheme> = {
  'gallery-bone': {
    key: 'gallery-bone',
    label: 'Bone',
    palette: {
      bg: '#F2ECE2',
      fg: '#1D1A16',
      fgMuted: '#6B6258',
      accent: '#9A4A2F',
      rule: '#DCD2C4',
    },
    type: GALLERY_TYPE,
    spacing: GALLERY_SPACING,
    atmosphere: {
      photoFilter: 'saturate(0.88) contrast(1.03) sepia(0.10) brightness(1.0)',
    },
    motion: GALLERY_MOTION,
  },

  'gallery-slate': {
    key: 'gallery-slate',
    label: 'Slate',
    palette: {
      bg: '#E6E9EC',
      fg: '#1E262C',
      fgMuted: '#586068',
      accent: '#2F6E73',
      rule: '#CDD4D9',
    },
    type: GALLERY_TYPE,
    spacing: GALLERY_SPACING,
    atmosphere: {
      photoFilter: 'saturate(0.82) contrast(1.05) brightness(0.99)',
    },
    motion: GALLERY_MOTION,
  },

  'gallery-ink': {
    key: 'gallery-ink',
    label: 'Ink',
    palette: {
      bg: '#15120E',
      fg: '#F0E9DD',
      fgMuted: '#A89E8E',
      accent: '#C9912F',
      rule: '#3A332B',
    },
    type: GALLERY_TYPE,
    spacing: GALLERY_SPACING,
    atmosphere: {
      photoFilter: 'saturate(0.92) contrast(1.06) brightness(0.9)',
      wash:
        'background: radial-gradient(ellipse at 50% 0%, rgba(201, 145, 47, 0.05), transparent 60%);',
    },
    motion: GALLERY_MOTION,
  },

  'gallery-linen': {
    key: 'gallery-linen',
    label: 'Linen',
    palette: {
      bg: '#EDE7DA',
      fg: '#2A2620',
      fgMuted: '#6E6353',
      accent: '#6E7A53',
      rule: '#D7CDBB',
    },
    type: GALLERY_TYPE,
    spacing: GALLERY_SPACING,
    atmosphere: {
      photoFilter: 'saturate(0.8) contrast(1.02) sepia(0.16) brightness(1.0)',
    },
    motion: GALLERY_MOTION,
  },
};

export type GalleryThemeKey = keyof typeof GALLERY_THEMES;
