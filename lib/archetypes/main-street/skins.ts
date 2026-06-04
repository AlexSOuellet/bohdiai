/**
 * Main Street — the skin shelf.
 *
 * A skin is the CLOTHES: color (two surfaces, each with readable text), a
 * three-voice type system (display + body + label), grain, and a photo grade.
 * The bones (composition, type SCALE, spacing, motion) live in the renderer and
 * never change per skin. The renderer reads everything here generically — it
 * names no color and no font — so the same Main Street wears any skin, light or
 * dark, with zero code change.
 *
 * The shelf spans three niche CHARACTERS (homey / rugged / delicate). A skin
 * carries only a character + a few moods as its tag — never a niche list — so
 * the shelf stays short no matter how many niches accrue (the niche→character
 * mapping lives with the niches). Selection reads those tags; nothing here does
 * the picking.
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
 *  shared (bones); the three faces + their weights change per skin (clothes).
 *  Display roles are deliberately large — conviction, not a corner logo. */
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

/** Each voice a skin supplies: a font family and how heavy to draw it. A single
 *  weight per voice is enough — the scale (sizes) is shared bones. */
interface TypeVoices {
  display: string;
  displayWeight: number;
  /** Some skins (industrial / signage) want their big type uppercased. */
  displayUppercase?: boolean;
  body: string;
  bodyWeight?: number;
  /** The small/label voice — a mono OR a letterspaced sans, set in caps. */
  label: string;
  labelWeight?: number;
}

function makeType(v: TypeVoices): Record<string, TypeRole> {
  const upper = v.displayUppercase === true;
  // display role
  const d = (size: number, sizeMobile: number, ls: string, lh: number): TypeRole => ({
    family: v.display,
    size,
    sizeMobile,
    weight: v.displayWeight,
    lineHeight: lh,
    letterSpacing: ls,
    ...(upper ? { uppercase: true } : {}),
  });
  // label/mono role — always uppercase, letterspaced
  const m = (size: number, ls: string): TypeRole => ({
    family: v.label,
    size,
    weight: v.labelWeight ?? 500,
    lineHeight: 1,
    letterSpacing: ls,
    uppercase: true,
  });
  const bodyWeight = v.bodyWeight ?? 400;
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
    price: { family: v.label, size: 12, weight: v.labelWeight ?? 500, lineHeight: 1, letterSpacing: '0.02em' },
    day: m(11, '0.12em'),
    sig: m(12, '0.2em'),
    legal: m(10, '0.18em'),
    body: { family: v.body, size: 17, sizeMobile: 15, weight: bodyWeight, lineHeight: 1.6 },
    caption: { family: v.body, size: 14, weight: bodyWeight, lineHeight: 1.5 },
    where: { family: v.body, size: 15, weight: bodyWeight, lineHeight: 1.4 },
  };
  return roles as unknown as Record<string, TypeRole>;
}

/** A skin's tag — one character bucket + a few moods. The whole tag. Never a
 *  niche list (that lives with the niches). Read by selection; inert here. */
export interface SkinTag {
  character: 'homey' | 'rugged' | 'delicate';
  moods: string[];
}

export const MAIN_STREET_SKINS: Record<string, ArchetypeTheme> = {
  // ── Character: homey ──────────────────────────────────────────────────────
  // Skin #1 — committed ember on warm cream. Bakery / farm / food.
  'main-street-ember': {
    key: 'main-street-ember',
    label: 'Ember',
    palette: {
      bg: '#F4EAD7',
      fg: '#2B1A12',
      fgMuted: '#7A6249',
      accent: '#C8431B',
      onAccent: '#FFFFFF',
      rule: 'rgba(43,26,18,0.16)',
      contrast: { bg: '#1C120B', fg: '#F4EAD7', fgMuted: 'rgba(244,234,215,0.66)' },
    },
    type: makeType({
      display: "'Instrument Serif', Georgia, serif",
      displayWeight: 400,
      body: "'Inter', system-ui, sans-serif",
      label: "'IBM Plex Mono', ui-monospace, monospace",
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(1.02) contrast(1.04) sepia(0.06)' },
    motion: MOTION,
  },

  // ── Character: rugged ─────────────────────────────────────────────────────
  // Tannery — warm leather. Leather / wood / saddle.
  'main-street-tannery': {
    key: 'main-street-tannery',
    label: 'Tannery',
    palette: {
      bg: '#1A1410',
      fg: '#E9DCC4',
      fgMuted: 'rgba(233,220,196,0.62)',
      accent: '#C2873B',
      onAccent: '#1A1410',
      rule: 'rgba(233,220,196,0.16)',
      contrast: { bg: '#DED0B6', fg: '#1A1410', fgMuted: 'rgba(26,20,16,0.62)' },
    },
    type: makeType({
      display: "'Bitter', Georgia, serif",
      displayWeight: 800,
      body: "'Inter', system-ui, sans-serif",
      label: "'Space Mono', ui-monospace, monospace",
      labelWeight: 700,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(1.04) contrast(1.06) sepia(0.08) brightness(0.98)' },
    motion: MOTION,
  },

  // Forge — cold industrial. Metal / knives / hardware.
  'main-street-forge': {
    key: 'main-street-forge',
    label: 'Forge',
    palette: {
      bg: '#14171A',
      fg: '#DDE2E5',
      fgMuted: 'rgba(221,226,229,0.58)',
      accent: '#D9A21B',
      onAccent: '#14171A',
      rule: 'rgba(221,226,229,0.14)',
      contrast: { bg: '#E3E0D8', fg: '#14171A', fgMuted: 'rgba(20,23,26,0.60)' },
    },
    type: makeType({
      display: "'Oswald', 'Arial Narrow', sans-serif",
      displayWeight: 600,
      displayUppercase: true,
      body: "'Archivo', system-ui, sans-serif",
      label: "'JetBrains Mono', ui-monospace, monospace",
      labelWeight: 500,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(0.9) contrast(1.06)' },
    motion: MOTION,
  },

  // Anvil — butcher-sign monochrome. Butcher / smokehouse / gym.
  'main-street-anvil': {
    key: 'main-street-anvil',
    label: 'Anvil',
    palette: {
      bg: '#0F0F10',
      fg: '#EDEDEA',
      fgMuted: 'rgba(237,237,234,0.56)',
      accent: '#D63D2E',
      onAccent: '#FFFFFF',
      rule: 'rgba(237,237,234,0.14)',
      contrast: { bg: '#EDEDEA', fg: '#0F0F10', fgMuted: 'rgba(15,15,16,0.60)' },
    },
    type: makeType({
      display: "'Archivo Black', system-ui, sans-serif",
      displayWeight: 400,
      displayUppercase: true,
      body: "'Inter', system-ui, sans-serif",
      label: "'Space Mono', ui-monospace, monospace",
      labelWeight: 400,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'contrast(1.1) saturate(0.96)' },
    motion: MOTION,
  },

  // ── Character: delicate ───────────────────────────────────────────────────
  // Porcelain — romantic studio. Jewelry / ceramics / fine goods.
  'main-street-porcelain': {
    key: 'main-street-porcelain',
    label: 'Porcelain',
    palette: {
      bg: '#F6F2EE',
      fg: '#2C2429',
      fgMuted: 'rgba(44,36,41,0.55)',
      accent: '#B98A86',
      onAccent: '#FFFFFF',
      rule: 'rgba(44,36,41,0.12)',
      contrast: { bg: '#2E2230', fg: '#EFE6EA', fgMuted: 'rgba(239,230,234,0.60)' },
    },
    type: makeType({
      display: "'Cormorant Garamond', Georgia, serif",
      displayWeight: 500,
      body: "'Jost', system-ui, sans-serif",
      label: "'Jost', system-ui, sans-serif",
      labelWeight: 500,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(0.96) brightness(1.03) contrast(0.98)' },
    motion: MOTION,
  },

  // Botanical — earthy, seasonal. Florals / apothecary / herbalist.
  'main-street-botanical': {
    key: 'main-street-botanical',
    label: 'Botanical',
    palette: {
      bg: '#F3EFE4',
      fg: '#2A2E22',
      fgMuted: 'rgba(42,46,34,0.55)',
      accent: '#6F7B4E',
      onAccent: '#F3EFE4',
      rule: 'rgba(42,46,34,0.12)',
      contrast: { bg: '#20342A', fg: '#E4ECDF', fgMuted: 'rgba(228,236,223,0.62)' },
    },
    type: makeType({
      display: "'Fraunces', Georgia, serif",
      displayWeight: 600,
      body: "'Hanken Grotesk', system-ui, sans-serif",
      label: "'Space Mono', ui-monospace, monospace",
      labelWeight: 400,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(1.03) contrast(1.02) sepia(0.03)' },
    motion: MOTION,
  },

  // Atelier — clean luxury. Fine jewelry / perfume / fewer-better goods.
  'main-street-atelier': {
    key: 'main-street-atelier',
    label: 'Atelier',
    palette: {
      bg: '#FAF8F5',
      fg: '#14110E',
      fgMuted: 'rgba(20,17,14,0.50)',
      accent: '#A8854C',
      onAccent: '#FAF8F5',
      rule: 'rgba(20,17,14,0.10)',
      contrast: { bg: '#14110E', fg: '#F1ECE4', fgMuted: 'rgba(241,236,228,0.60)' },
    },
    type: makeType({
      display: "'Bodoni Moda', Georgia, serif",
      displayWeight: 500,
      body: "'Inter', system-ui, sans-serif",
      label: "'Inter', system-ui, sans-serif",
      labelWeight: 500,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'contrast(1.04) saturate(0.98) brightness(1.01)' },
    motion: MOTION,
  },
};

/** Selection tags — character + moods per skin. Inert here; read by selection. */
export const MAIN_STREET_SKIN_TAGS: Record<string, SkinTag> = {
  'main-street-ember': { character: 'homey', moods: ['cozy', 'rustic', 'warm'] },
  'main-street-tannery': { character: 'rugged', moods: ['warm', 'handmade'] },
  'main-street-forge': { character: 'rugged', moods: ['cool', 'industrial', 'modern'] },
  'main-street-anvil': { character: 'rugged', moods: ['bold', 'plain', 'loud'] },
  'main-street-porcelain': { character: 'delicate', moods: ['romantic', 'quiet', 'fine'] },
  'main-street-botanical': { character: 'delicate', moods: ['earthy', 'natural', 'seasonal'] },
  'main-street-atelier': { character: 'delicate', moods: ['sharp', 'luxury', 'modern'] },
};

export const MAIN_STREET_FONT_HREFS: Record<string, string> = {
  'main-street-ember':
    'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap',
  'main-street-tannery':
    'https://fonts.googleapis.com/css2?family=Bitter:wght@400;600;800&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap',
  'main-street-forge':
    'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Archivo:wght@400;500;700&family=JetBrains+Mono:wght@500&display=swap',
  'main-street-anvil':
    'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap',
  'main-street-porcelain':
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500;600&display=swap',
  'main-street-botanical':
    'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Hanken+Grotesk:wght@400;500;600&family=Space+Mono:wght@400&display=swap',
  'main-street-atelier':
    'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Inter:wght@400;500;600&display=swap',
};

export type MainStreetSkinKey = keyof typeof MAIN_STREET_SKINS;
