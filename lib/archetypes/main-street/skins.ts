/**
 * Main Street — the skin shelf.
 *
 * A skin is the CLOTHES: color (two surfaces, each with readable text), a
 * three-voice type system (display + body + mono), grain, and a photo grade.
 * The bones (composition, type SCALE, spacing, motion) live in the renderer and
 * never change per skin. The renderer reads everything here generically — it
 * names no color and no font — so the same Main Street wears any skin, light or
 * dark, with zero code change.
 *
 * Skin #1 ("ember") is extracted from the validated mockup. The shelf grows by
 * adding skins here; the renderer is untouched.
 */
import type { ArchetypeTheme, TypeRole } from '../types';

const MOTION = {
  // Slow and deliberate — motion is an event, not a state. Linear, never eased.
  reveal: { duration: 1100, stagger: 120, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
} as const;

const SPACING = { hairline: 1, tight: 8, base: 16, loose: 32, section: 96, page: 130 };

// Faint paper grain — a technique shared across skins, opacity tuned in the CSS.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** The 17-role type system, built from a skin's three voices. The SCALE is
 *  shared (bones); the three faces change per skin (clothes). Display roles are
 *  deliberately large — conviction, not a corner logo. */
export interface MainStreetRoles {
  wordmark: TypeRole;
  brand: TypeRole;
  storyline: TypeRole;
  goodsHead: TypeRole;
  title: TypeRole;
  cardTitle: TypeRole;
  quote: TypeRole;
  closeHead: TypeRole;
  eyebrow: TypeRole;
  navLabel: TypeRole;
  price: TypeRole;
  day: TypeRole;
  sig: TypeRole;
  legal: TypeRole;
  body: TypeRole;
  caption: TypeRole;
  where: TypeRole;
}

function makeType(display: string, body: string, mono: string): Record<string, TypeRole> {
  const d = (size: number, sizeMobile: number, ls: string, lh: number): TypeRole => ({
    family: display,
    size,
    sizeMobile,
    weight: 400,
    lineHeight: lh,
    letterSpacing: ls,
  });
  const m = (size: number, ls: string): TypeRole => ({
    family: mono,
    size,
    weight: 500,
    lineHeight: 1,
    letterSpacing: ls,
    uppercase: true,
  });
  const roles: MainStreetRoles = {
    wordmark: d(26, 22, '-0.01em', 1.0),
    brand: d(124, 52, '-0.02em', 0.95),
    storyline: d(76, 32, '-0.01em', 1.08),
    goodsHead: d(64, 34, '-0.01em', 1.0),
    title: d(34, 26, '-0.01em', 1.05),
    cardTitle: d(27, 24, '0', 1.05),
    quote: d(44, 28, '-0.01em', 1.15),
    closeHead: d(92, 40, '-0.015em', 0.98),
    eyebrow: m(12, '0.22em'),
    navLabel: m(11, '0.2em'),
    price: { family: mono, size: 12, weight: 500, lineHeight: 1, letterSpacing: '0.02em' },
    day: m(11, '0.12em'),
    sig: m(12, '0.2em'),
    legal: m(10, '0.18em'),
    body: { family: body, size: 17, sizeMobile: 15, weight: 400, lineHeight: 1.6 },
    caption: { family: body, size: 14, weight: 400, lineHeight: 1.5 },
    where: { family: body, size: 15, weight: 400, lineHeight: 1.4 },
  };
  return roles as unknown as Record<string, TypeRole>;
}

const INSTRUMENT = "'Instrument Serif', Georgia, serif";
const INTER = "'Inter', system-ui, sans-serif";
const PLEX_MONO = "'IBM Plex Mono', ui-monospace, monospace";

export const MAIN_STREET_SKINS: Record<string, ArchetypeTheme> = {
  // Skin #1 — committed ember on warm cream; character "homey/warm"; mood lean cozy/rustic.
  'main-street-ember': {
    key: 'main-street-ember',
    label: 'Ember',
    palette: {
      bg: '#F4EAD7',
      fg: '#2B1A12',
      fgMuted: '#7A6249',
      accent: '#C8431B',
      rule: 'rgba(43,26,18,0.16)',
      contrast: { bg: '#1C120B', fg: '#F4EAD7', fgMuted: 'rgba(244,234,215,0.66)' },
    },
    type: makeType(INSTRUMENT, INTER, PLEX_MONO),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(1.02) contrast(1.04) sepia(0.06)' },
    motion: MOTION,
  },
};

export const MAIN_STREET_FONT_HREFS: Record<string, string> = {
  'main-street-ember':
    'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap',
};

export type MainStreetSkinKey = keyof typeof MAIN_STREET_SKINS;
