/**
 * Main Street archetype — curated themes.
 *
 * Each theme is a complete designed package: a readable color pair, a type
 * system with hierarchy, a spacing scale, a unifying photo grade, and motion.
 * Bohdi picks one by key; he cannot mix across themes — that is how the
 * archetype prevents the lost-color and unreadable-type failures by
 * construction. One shared type pairing carries all four today (per-theme
 * pairings can be added later).
 *
 * Palettes map to Main Street's natural moods (Paper=SIMPLE, Amber=COZY,
 * Field=RUSTIC, Cobalt=MODERN). They are STARTER values pending Alex's design
 * review and the eyes pass — real, so the module renders, not final.
 */
import type { ArchetypeTheme } from '../types';

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

/** A warm, friendly, familiar pairing: humanist optical serif display
 *  (Fraunces), clean humanist sans body (Mulish), mono for prices. */
const MAIN_STREET_TYPE: Record<string, ArchetypeTheme['type'][string]> = {
  wordmark: {
    family: "'Fraunces', Georgia, serif",
    size: 26,
    sizeMobile: 22,
    weight: 700,
    lineHeight: 1.0,
    letterSpacing: '-0.01em',
    variationSettings: '"opsz" 72',
  },
  tagline: {
    family: "'Mulish', system-ui, sans-serif",
    size: 14,
    sizeMobile: 13,
    weight: 400,
    lineHeight: 1.4,
  },
  nav: {
    family: "'Mulish', system-ui, sans-serif",
    size: 12,
    sizeMobile: 12,
    weight: 600,
    lineHeight: 1,
    letterSpacing: '0.12em',
    uppercase: true,
  },
  label: {
    family: "'Mulish', system-ui, sans-serif",
    size: 11,
    sizeMobile: 11,
    weight: 700,
    lineHeight: 1,
    letterSpacing: '0.18em',
    uppercase: true,
  },
  heroHead: {
    family: "'Fraunces', Georgia, serif",
    size: 56,
    sizeMobile: 36,
    weight: 600,
    lineHeight: 1.05,
    letterSpacing: '-0.02em',
    variationSettings: '"opsz" 144',
  },
  makerHead: {
    family: "'Fraunces', Georgia, serif",
    size: 34,
    sizeMobile: 26,
    weight: 600,
    lineHeight: 1.12,
    letterSpacing: '-0.015em',
    variationSettings: '"opsz" 96',
  },
  title: {
    family: "'Fraunces', Georgia, serif",
    size: 24,
    sizeMobile: 20,
    weight: 600,
    lineHeight: 1.15,
    letterSpacing: '-0.01em',
    variationSettings: '"opsz" 72',
  },
  body: {
    family: "'Mulish', system-ui, sans-serif",
    size: 16,
    sizeMobile: 15,
    weight: 400,
    lineHeight: 1.6,
  },
  price: {
    family: "'DM Mono', 'Courier New', monospace",
    size: 13,
    sizeMobile: 13,
    weight: 500,
    lineHeight: 1,
    letterSpacing: '0.02em',
  },
  caption: {
    family: "'Mulish', system-ui, sans-serif",
    size: 13,
    sizeMobile: 13,
    weight: 400,
    lineHeight: 1.5,
  },
};

export const MAIN_STREET_THEMES: Record<string, ArchetypeTheme> = {
  'main-street-paper': {
    key: 'main-street-paper',
    label: 'Paper',
    palette: { bg: '#FBF8F2', fg: '#21201C', fgMuted: '#6A655C', accent: '#B5542F', rule: '#E7E0D4' },
    type: MAIN_STREET_TYPE,
    spacing: MAIN_STREET_SPACING,
    atmosphere: { photoFilter: 'saturate(0.94) contrast(1.02) brightness(1.0)' },
    motion: MAIN_STREET_MOTION,
  }, // SIMPLE

  'main-street-amber': {
    key: 'main-street-amber',
    label: 'Amber',
    palette: { bg: '#F5ECDD', fg: '#2C2018', fgMuted: '#6E5A4B', accent: '#B06A2C', rule: '#E4D7C4' },
    type: MAIN_STREET_TYPE,
    spacing: MAIN_STREET_SPACING,
    atmosphere: { photoFilter: 'saturate(0.96) contrast(1.03) sepia(0.10) brightness(1.0)' },
    motion: MAIN_STREET_MOTION,
  }, // COZY

  'main-street-field': {
    key: 'main-street-field',
    label: 'Field',
    palette: { bg: '#EEEAE0', fg: '#27261F', fgMuted: '#665F4F', accent: '#5E6B3B', rule: '#D9D3C3' },
    type: MAIN_STREET_TYPE,
    spacing: MAIN_STREET_SPACING,
    atmosphere: { photoFilter: 'saturate(0.9) contrast(1.02) sepia(0.08) brightness(1.0)' },
    motion: MAIN_STREET_MOTION,
  }, // RUSTIC

  'main-street-cobalt': {
    key: 'main-street-cobalt',
    label: 'Cobalt',
    palette: { bg: '#F4F4F2', fg: '#161618', fgMuted: '#5C5C60', accent: '#1F4FD6', rule: '#DEDEDC' },
    type: MAIN_STREET_TYPE,
    spacing: MAIN_STREET_SPACING,
    atmosphere: { photoFilter: 'saturate(1.0) contrast(1.04) brightness(1.0)' },
    motion: MAIN_STREET_MOTION,
  }, // MODERN
};

export type MainStreetThemeKey = keyof typeof MAIN_STREET_THEMES;
