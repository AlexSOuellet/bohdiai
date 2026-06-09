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
 * The shelf is organized by maker-WORLDS — loose families of maker (Hearth,
 * Workshop, Fine, Garden, Studio, Mystic, Playroom, Press, Relic). A skin
 * carries only a world + a few moods as its tag — never a niche list — so the
 * shelf stays short no matter how many niches accrue (the niche→world mapping
 * lives with the niches). The shelf goes DEEP: several skins per world spanning
 * its real range (light/dark, quiet/loud). The differentiator is the TYPEFACE —
 * no two skins share a display face, so even two cream skins never read as
 * cousins. Selection is Bohdi's call off the menu; nothing here does the picking.
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
    brand: d(84, 44, '-0.02em', 0.98),
    storyline: d(52, 30, '-0.01em', 1.1),
    goodsHead: d(44, 30, '-0.01em', 1.04),
    title: d(30, 24, '-0.01em', 1.08),
    cardTitle: d(27, 24, '0', 1.05),
    quote: d(27, 21, '-0.01em', 1.3),
    closeHead: d(64, 36, '-0.015em', 1.0),
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

/** The nine maker-worlds a skin can belong to. A loose selection family, not a
 *  hard bucket — a new niche classifies into a world and inherits its skins. */
export type MakerWorld =
  | 'Hearth'
  | 'Workshop'
  | 'Fine'
  | 'Garden'
  | 'Studio'
  | 'Mystic'
  | 'Playroom'
  | 'Press'
  | 'Relic';

/** A skin's tag — one world + a few moods. The whole tag. Never a niche list
 *  (that lives with the niches). Read by the menu; inert for selection. */
export interface SkinTag {
  world: MakerWorld;
  moods: string[];
}

export const MAIN_STREET_SKINS: Record<string, ArchetypeTheme> = {
  // ══ HEARTH ════ warm, handmade, domestic: baker, jam, soap, candles, fiber ══
  // Ember — committed ember on warm cream. The cozy morning.
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

  // Orchard — golden evening. Honey, jam, harvest, cider.
  'main-street-orchard': {
    key: 'main-street-orchard',
    label: 'Orchard',
    palette: {
      bg: '#EFD9B4',
      fg: '#3A2415',
      fgMuted: 'rgba(58,36,21,0.58)',
      accent: '#C2562F',
      onAccent: '#FFF6EA',
      rule: 'rgba(58,36,21,0.18)',
      contrast: { bg: '#3C2230', fg: '#EFD9B4', fgMuted: 'rgba(239,217,180,0.66)' },
    },
    type: makeType({
      display: "'Hedvig Letters Serif', Georgia, serif",
      displayWeight: 400,
      body: "'Karla', system-ui, sans-serif",
      label: "'Fragment Mono', ui-monospace, monospace",
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(1.05) contrast(1.03) sepia(0.10)' },
    motion: MOTION,
  },

  // Pantry — bright farm-fresh kitchen. Baker, preserves, market stall.
  'main-street-pantry': {
    key: 'main-street-pantry',
    label: 'Pantry',
    palette: {
      bg: '#FBF3E2',
      fg: '#2E3A2B',
      fgMuted: 'rgba(46,58,43,0.58)',
      accent: '#C0432E',
      onAccent: '#FFFFFF',
      rule: 'rgba(46,58,43,0.16)',
      contrast: { bg: '#2E3A2B', fg: '#FBF3E2', fgMuted: 'rgba(251,243,226,0.66)' },
    },
    type: makeType({
      display: "'Zilla Slab', Georgia, serif",
      displayWeight: 600,
      body: "'Mulish', system-ui, sans-serif",
      label: "'Sometype Mono', ui-monospace, monospace",
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(1.06) brightness(1.03) contrast(1.02)' },
    motion: MOTION,
  },

  // Hearthstone — candlelit dark warm. Candles, soap, evening fiber.
  'main-street-hearthstone': {
    key: 'main-street-hearthstone',
    label: 'Hearthstone',
    palette: {
      bg: '#1B1410',
      fg: '#ECDCC2',
      fgMuted: 'rgba(236,220,194,0.60)',
      accent: '#D98A3D',
      onAccent: '#1B1410',
      rule: 'rgba(236,220,194,0.14)',
      contrast: { bg: '#E4D2B4', fg: '#1B1410', fgMuted: 'rgba(27,20,16,0.62)' },
    },
    type: makeType({
      display: "'DM Serif Display', Georgia, serif",
      displayWeight: 400,
      body: "'EB Garamond', Georgia, serif",
      label: "'Anonymous Pro', ui-monospace, monospace",
      labelWeight: 700,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(1.0) contrast(1.05) brightness(0.95) sepia(0.06)' },
    motion: MOTION,
  },

  // ══ WORKSHOP ════ rugged, made-to-last: leather, wood, metal, knives, meat ══
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

  // Sawdust — daylight woodshop. The workshop with the doors open.
  'main-street-sawdust': {
    key: 'main-street-sawdust',
    label: 'Sawdust',
    palette: {
      bg: '#E7DAC4',
      fg: '#2A2118',
      fgMuted: 'rgba(42,33,24,0.58)',
      accent: '#B06A2C',
      onAccent: '#FFF8EC',
      rule: 'rgba(42,33,24,0.18)',
      contrast: { bg: '#2A2118', fg: '#E7DAC4', fgMuted: 'rgba(231,218,196,0.64)' },
    },
    type: makeType({
      display: "'Hepta Slab', Georgia, serif",
      displayWeight: 700,
      body: "'Public Sans', system-ui, sans-serif",
      label: "'Overpass Mono', ui-monospace, monospace",
      labelWeight: 500,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(1.02) contrast(1.04) sepia(0.05)' },
    motion: MOTION,
  },

  // ══ FINE ════ refined, quiet, luxe: jewelry, chocolatier, perfume, milliner ══
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

  // Atelier — clean modern. A sharp grotesque on bright paper; contemporary, minimal luxury.
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
      display: "'Space Grotesk', system-ui, sans-serif",
      displayWeight: 600,
      body: "'Inter', system-ui, sans-serif",
      label: "'Inter', system-ui, sans-serif",
      labelWeight: 500,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'contrast(1.04) saturate(0.98) brightness(1.01)' },
    motion: MOTION,
  },

  // Gild — dark luxe. Black and thin gold; the lit jewel case.
  'main-street-gild': {
    key: 'main-street-gild',
    label: 'Gild',
    palette: {
      bg: '#15120E',
      fg: '#F0E9DC',
      fgMuted: 'rgba(240,233,220,0.55)',
      accent: '#C2A35A',
      onAccent: '#15120E',
      rule: 'rgba(240,233,220,0.12)',
      contrast: { bg: '#F0E9DC', fg: '#15120E', fgMuted: 'rgba(21,18,14,0.58)' },
    },
    type: makeType({
      display: "'Prata', Georgia, serif",
      displayWeight: 400,
      body: "'Manrope', system-ui, sans-serif",
      label: "'Manrope', system-ui, sans-serif",
      labelWeight: 600,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'contrast(1.05) saturate(0.98) brightness(0.98)' },
    motion: MOTION,
  },

  // ══ GARDEN ════ botanical, earthy, seasonal: florist, plants, apothecary ══
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

  // Conservatory — airy glasshouse. Light, classical, green.
  'main-street-conservatory': {
    key: 'main-street-conservatory',
    label: 'Conservatory',
    palette: {
      bg: '#EEF0E4',
      fg: '#283324',
      fgMuted: 'rgba(40,51,36,0.55)',
      accent: '#5C7A4A',
      onAccent: '#EEF0E4',
      rule: 'rgba(40,51,36,0.12)',
      contrast: { bg: '#1F2C20', fg: '#E7EDDD', fgMuted: 'rgba(231,237,221,0.62)' },
    },
    type: makeType({
      display: "'Marcellus', Georgia, serif",
      displayWeight: 400,
      body: "'Karla', system-ui, sans-serif",
      label: "'Syne Mono', ui-monospace, monospace",
      labelWeight: 400,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(1.04) brightness(1.02) contrast(1.0)' },
    motion: MOTION,
  },

  // Wildflower — colorful meadow. The bright, blowsy cut-flower stand.
  'main-street-wildflower': {
    key: 'main-street-wildflower',
    label: 'Wildflower',
    palette: {
      bg: '#F4EFDF',
      fg: '#33301F',
      fgMuted: 'rgba(51,48,31,0.55)',
      accent: '#C76B86',
      onAccent: '#FFFFFF',
      rule: 'rgba(51,48,31,0.14)',
      contrast: { bg: '#43492A', fg: '#F4EFDF', fgMuted: 'rgba(244,239,223,0.64)' },
    },
    type: makeType({
      display: "'Yeseva One', Georgia, serif",
      displayWeight: 400,
      body: "'Mulish', system-ui, sans-serif",
      label: "'Red Hat Mono', ui-monospace, monospace",
      labelWeight: 500,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(1.08) brightness(1.02) contrast(1.02)' },
    motion: MOTION,
  },

  // ══ STUDIO ════ art-forward, the goods ARE the art: painter, printmaker ══
  // Studio — quiet gallery wall. Bone white, huge ink type, one hot signal.
  'main-street-studio': {
    key: 'main-street-studio',
    label: 'Studio',
    palette: {
      bg: '#F4F1EA',
      fg: '#16140F',
      fgMuted: 'rgba(22,20,15,0.52)',
      accent: '#E5391B',
      onAccent: '#FFFFFF',
      rule: 'rgba(22,20,15,0.12)',
      contrast: { bg: '#1A1814', fg: '#F0EBE0', fgMuted: 'rgba(240,235,224,0.60)' },
    },
    type: makeType({
      display: "'Syne', system-ui, sans-serif",
      displayWeight: 800,
      body: "'Newsreader', Georgia, serif",
      label: "'Syne', system-ui, sans-serif",
      labelWeight: 600,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'contrast(1.05) saturate(1.02)' },
    motion: MOTION,
  },

  // Darkroom — moody dark gallery. Charcoal wall, cold slate signal.
  'main-street-darkroom': {
    key: 'main-street-darkroom',
    label: 'Darkroom',
    palette: {
      bg: '#16171A',
      fg: '#E4E2DC',
      fgMuted: 'rgba(228,226,220,0.55)',
      accent: '#6E8FA6',
      onAccent: '#16171A',
      rule: 'rgba(228,226,220,0.12)',
      contrast: { bg: '#E4E2DC', fg: '#16171A', fgMuted: 'rgba(22,23,26,0.60)' },
    },
    type: makeType({
      display: "'Bricolage Grotesque', system-ui, sans-serif",
      displayWeight: 700,
      body: "'Source Serif 4', Georgia, serif",
      label: "'Geist Mono', ui-monospace, monospace",
      labelWeight: 500,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'contrast(1.06) saturate(0.96) brightness(0.97)' },
    motion: MOTION,
  },

  // Pigment — vivid gallery for colorful work. Bright white, hot magenta.
  'main-street-pigment': {
    key: 'main-street-pigment',
    label: 'Pigment',
    palette: {
      bg: '#FBFAF6',
      fg: '#1A1730',
      fgMuted: 'rgba(26,23,48,0.5)',
      accent: '#E4007C',
      onAccent: '#FFFFFF',
      rule: 'rgba(26,23,48,0.12)',
      contrast: { bg: '#1A1730', fg: '#FBFAF6', fgMuted: 'rgba(251,250,246,0.64)' },
    },
    type: makeType({
      display: "'Darker Grotesque', system-ui, sans-serif",
      displayWeight: 800,
      body: "'Mada', system-ui, sans-serif",
      label: "'Sometype Mono', ui-monospace, monospace",
      labelWeight: 500,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(1.1) contrast(1.04)' },
    motion: MOTION,
  },

  // ══ MYSTIC ════ esoteric, moody, celestial: tarot, crystals, ritual, occult ══
  // Nightshade — deep occult. Violet-black, moonlight type, electric amethyst.
  'main-street-nightshade': {
    key: 'main-street-nightshade',
    label: 'Nightshade',
    palette: {
      bg: '#14101F',
      fg: '#E7E2F1',
      fgMuted: 'rgba(231,226,241,0.58)',
      accent: '#9D6BEC',
      onAccent: '#14101F',
      rule: 'rgba(201,162,75,0.30)',
      contrast: { bg: '#221A33', fg: '#ECE6F6', fgMuted: 'rgba(236,230,246,0.62)' },
    },
    type: makeType({
      display: "'Gloock', Georgia, serif",
      displayWeight: 400,
      body: "'Spectral', Georgia, serif",
      label: "'Martian Mono', ui-monospace, monospace",
      labelWeight: 500,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(0.92) contrast(1.06) brightness(0.95)' },
    motion: MOTION,
  },

  // Celestine — soft celestial. Pale dawn-lilac, dusk-violet, star-chart calm.
  'main-street-celestine': {
    key: 'main-street-celestine',
    label: 'Celestine',
    palette: {
      bg: '#ECE9F2',
      fg: '#2A2540',
      fgMuted: 'rgba(42,37,64,0.55)',
      accent: '#7A6FB0',
      onAccent: '#ECE9F2',
      rule: 'rgba(42,37,64,0.14)',
      contrast: { bg: '#221E38', fg: '#E9E5F3', fgMuted: 'rgba(233,229,243,0.62)' },
    },
    type: makeType({
      display: "'Cinzel', Georgia, serif",
      displayWeight: 600,
      body: "'Cardo', Georgia, serif",
      label: "'Fragment Mono', ui-monospace, monospace",
      labelWeight: 400,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(0.98) brightness(1.02) contrast(1.0)' },
    motion: MOTION,
  },

  // Ritual — blood and candle. Near-black, bone type, a single blood red.
  'main-street-ritual': {
    key: 'main-street-ritual',
    label: 'Ritual',
    palette: {
      bg: '#120D0D',
      fg: '#E8DCD2',
      fgMuted: 'rgba(232,220,210,0.55)',
      accent: '#A11D2A',
      onAccent: '#E8DCD2',
      rule: 'rgba(232,220,210,0.12)',
      contrast: { bg: '#2A1012', fg: '#E8DCD2', fgMuted: 'rgba(232,220,210,0.60)' },
    },
    type: makeType({
      display: "'Eczar', Georgia, serif",
      displayWeight: 700,
      body: "'Vollkorn', Georgia, serif",
      label: "'Sometype Mono', ui-monospace, monospace",
      labelWeight: 500,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(1.0) contrast(1.08) brightness(0.9)' },
    motion: MOTION,
  },

  // ══ PLAYROOM ════ playful, bright: stickers, pins, polymer clay, toys, plush ══
  // Confetti — butter-bright. Rounded heavy type, poppy and grape in tension.
  'main-street-confetti': {
    key: 'main-street-confetti',
    label: 'Confetti',
    palette: {
      bg: '#FCEFD6',
      fg: '#20223A',
      fgMuted: 'rgba(32,34,58,0.55)',
      accent: '#FB4D3D',
      onAccent: '#FFFFFF',
      rule: 'rgba(32,34,58,0.14)',
      contrast: { bg: '#2E2350', fg: '#FCEFD6', fgMuted: 'rgba(252,239,214,0.66)' },
    },
    type: makeType({
      display: "'Unbounded', system-ui, sans-serif",
      displayWeight: 700,
      body: "'Figtree', system-ui, sans-serif",
      label: "'DM Mono', ui-monospace, monospace",
      labelWeight: 500,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(1.08) contrast(1.02) brightness(1.02)' },
    motion: MOTION,
  },

  // Bubblegum — candy loud. Cotton-candy white, bubblegum pink, pool cyan.
  'main-street-bubblegum': {
    key: 'main-street-bubblegum',
    label: 'Bubblegum',
    palette: {
      bg: '#FFF0F5',
      fg: '#2A1A3E',
      fgMuted: 'rgba(42,26,62,0.5)',
      accent: '#FF4FA3',
      onAccent: '#FFFFFF',
      rule: 'rgba(42,26,62,0.12)',
      contrast: { bg: '#18B3C4', fg: '#06222A', fgMuted: 'rgba(6,34,42,0.62)' },
    },
    type: makeType({
      display: "'Fredoka', system-ui, sans-serif",
      displayWeight: 600,
      body: "'Nunito', system-ui, sans-serif",
      label: "'Spline Sans Mono', ui-monospace, monospace",
      labelWeight: 500,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(1.12) brightness(1.03) contrast(1.0)' },
    motion: MOTION,
  },

  // Sprout — gentle pastel. The calm, friendly end of playful — a choice, not a shout.
  'main-street-sprout': {
    key: 'main-street-sprout',
    label: 'Sprout',
    palette: {
      bg: '#F2F4E9',
      fg: '#34402F',
      fgMuted: 'rgba(52,64,47,0.55)',
      accent: '#E08A4B',
      onAccent: '#FFFFFF',
      rule: 'rgba(52,64,47,0.12)',
      contrast: { bg: '#3C4A47', fg: '#F2F4E9', fgMuted: 'rgba(242,244,233,0.64)' },
    },
    type: makeType({
      display: "'Quicksand', system-ui, sans-serif",
      displayWeight: 700,
      body: "'Nunito Sans', system-ui, sans-serif",
      label: "'Red Hat Mono', ui-monospace, monospace",
      labelWeight: 500,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(1.02) brightness(1.03) contrast(0.99)' },
    motion: MOTION,
  },

  // ══ PRESS ════ graphic, inky, urban: screenprint, zines, streetwear ══
  // Pressroom — riso overprint. Bone paper, off-register red and blue.
  'main-street-pressroom': {
    key: 'main-street-pressroom',
    label: 'Pressroom',
    palette: {
      bg: '#F1EBDE',
      fg: '#15140F',
      fgMuted: 'rgba(21,20,15,0.55)',
      accent: '#F5333F',
      onAccent: '#FFFFFF',
      rule: 'rgba(21,20,15,0.14)',
      contrast: { bg: '#2536D4', fg: '#F1EBDE', fgMuted: 'rgba(241,235,222,0.66)' },
    },
    type: makeType({
      display: "'Big Shoulders Display', 'Arial Narrow', sans-serif",
      displayWeight: 700,
      displayUppercase: true,
      body: "'Schibsted Grotesk', system-ui, sans-serif",
      label: "'Spline Sans Mono', ui-monospace, monospace",
      labelWeight: 500,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'contrast(1.08) saturate(1.05)' },
    motion: MOTION,
  },

  // Marquee — streetwear poster. Black, one neon-lime, a wall of caps.
  'main-street-marquee': {
    key: 'main-street-marquee',
    label: 'Marquee',
    palette: {
      bg: '#0E0E0E',
      fg: '#F2F2EF',
      fgMuted: 'rgba(242,242,239,0.55)',
      accent: '#C6FF00',
      onAccent: '#0E0E0E',
      rule: 'rgba(242,242,239,0.14)',
      contrast: { bg: '#F2F2EF', fg: '#0E0E0E', fgMuted: 'rgba(14,14,14,0.60)' },
    },
    type: makeType({
      display: "'Anton', 'Arial Narrow', sans-serif",
      displayWeight: 400,
      displayUppercase: true,
      body: "'Hanken Grotesk', system-ui, sans-serif",
      label: "'JetBrains Mono', ui-monospace, monospace",
      labelWeight: 500,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'contrast(1.1) saturate(1.04)' },
    motion: MOTION,
  },

  // Broadside — raw zine. Newsprint gray, stamped red, condensed caps.
  'main-street-broadside': {
    key: 'main-street-broadside',
    label: 'Broadside',
    palette: {
      bg: '#E8E4DA',
      fg: '#161514',
      fgMuted: 'rgba(22,21,20,0.58)',
      accent: '#D6322A',
      onAccent: '#FFFFFF',
      rule: 'rgba(22,21,20,0.18)',
      contrast: { bg: '#161514', fg: '#E8E4DA', fgMuted: 'rgba(232,228,218,0.64)' },
    },
    type: makeType({
      display: "'Bebas Neue', 'Arial Narrow', sans-serif",
      displayWeight: 400,
      displayUppercase: true,
      body: "'IBM Plex Sans', system-ui, sans-serif",
      label: "'Sometype Mono', ui-monospace, monospace",
      labelWeight: 500,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'grayscale(0.15) contrast(1.12) saturate(0.9)' },
    motion: MOTION,
  },

  // ══ RELIC ════ vintage, nostalgic, aged: antiques, ephemera, mid-century ══
  // Heirloom — aged ochre. Faded paper, sepia ink, worn teal and oxblood.
  'main-street-heirloom': {
    key: 'main-street-heirloom',
    label: 'Heirloom',
    palette: {
      bg: '#ECE3CE',
      fg: '#36291A',
      fgMuted: 'rgba(54,41,26,0.55)',
      accent: '#3E6E64',
      onAccent: '#ECE3CE',
      rule: 'rgba(54,41,26,0.16)',
      contrast: { bg: '#5A2E2A', fg: '#ECE3CE', fgMuted: 'rgba(236,227,206,0.66)' },
    },
    type: makeType({
      display: "'Libre Caslon Display', Georgia, serif",
      displayWeight: 400,
      body: "'Source Serif 4', Georgia, serif",
      label: "'Courier Prime', ui-monospace, monospace",
      labelWeight: 700,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'sepia(0.18) saturate(0.9) contrast(1.02) brightness(0.99)' },
    motion: MOTION,
  },

  // Curiosity — vintage cabinet. Deep wood, brass, a bottle-green band.
  'main-street-curiosity': {
    key: 'main-street-curiosity',
    label: 'Curiosity',
    palette: {
      bg: '#1C1A14',
      fg: '#DCCBA6',
      fgMuted: 'rgba(220,203,166,0.55)',
      accent: '#9A7B3A',
      onAccent: '#1C1A14',
      rule: 'rgba(220,203,166,0.14)',
      contrast: { bg: '#2C4038', fg: '#DCCBA6', fgMuted: 'rgba(220,203,166,0.60)' },
    },
    type: makeType({
      display: "'Abril Fatface', Georgia, serif",
      displayWeight: 400,
      body: "'Lora', Georgia, serif",
      label: "'Anonymous Pro', ui-monospace, monospace",
      labelWeight: 700,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'sepia(0.22) saturate(0.85) contrast(1.04) brightness(0.95)' },
    motion: MOTION,
  },

  // Postmark — mid-century ephemera. Aged paper, retro orange and teal.
  'main-street-postmark': {
    key: 'main-street-postmark',
    label: 'Postmark',
    palette: {
      bg: '#EDE4D0',
      fg: '#2E2A22',
      fgMuted: 'rgba(46,42,34,0.55)',
      accent: '#C25B36',
      onAccent: '#FFF8EC',
      rule: 'rgba(46,42,34,0.16)',
      contrast: { bg: '#2C5450', fg: '#EDE4D0', fgMuted: 'rgba(237,228,208,0.64)' },
    },
    type: makeType({
      display: "'Rozha One', Georgia, serif",
      displayWeight: 400,
      body: "'Crimson Pro', Georgia, serif",
      label: "'Sometype Mono', ui-monospace, monospace",
      labelWeight: 500,
    }),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'sepia(0.14) saturate(0.95) contrast(1.02)' },
    motion: MOTION,
  },
};

/** Selection tags — world + the maker-facing feelings each skin can wear. The
 *  feelings are the seven canonical moods (lib/moods); a skin can belong to more
 *  than one (Ember reads both rustic and cozy). `moodAlignedSkins` gates skin
 *  choice to the maker's chosen feeling off these tags. Every skin has at least
 *  one feeling and every feeling has 6+ skins, so no mood is left without a shelf. */
export const MAIN_STREET_SKIN_TAGS: Record<string, SkinTag> = {
  'main-street-ember': { world: 'Hearth', moods: ['rustic', 'cozy'] },
  'main-street-orchard': { world: 'Hearth', moods: ['cozy', 'rustic'] },
  'main-street-pantry': { world: 'Hearth', moods: ['cozy', 'playful'] },
  'main-street-hearthstone': { world: 'Hearth', moods: ['dark', 'cozy'] },
  'main-street-tannery': { world: 'Workshop', moods: ['rustic', 'industrial'] },
  'main-street-forge': { world: 'Workshop', moods: ['industrial', 'modern'] },
  'main-street-anvil': { world: 'Workshop', moods: ['modern'] },
  'main-street-sawdust': { world: 'Workshop', moods: ['rustic', 'cozy'] },
  'main-street-porcelain': { world: 'Fine', moods: ['elegant'] },
  'main-street-atelier': { world: 'Fine', moods: ['elegant', 'modern'] },
  'main-street-gild': { world: 'Fine', moods: ['dark', 'elegant'] },
  'main-street-botanical': { world: 'Garden', moods: ['rustic'] },
  'main-street-conservatory': { world: 'Garden', moods: ['elegant'] },
  'main-street-wildflower': { world: 'Garden', moods: ['playful'] },
  'main-street-studio': { world: 'Studio', moods: ['modern', 'industrial'] },
  'main-street-darkroom': { world: 'Studio', moods: ['dark', 'modern'] },
  'main-street-pigment': { world: 'Studio', moods: ['playful', 'modern'] },
  'main-street-nightshade': { world: 'Mystic', moods: ['dark'] },
  'main-street-celestine': { world: 'Mystic', moods: ['elegant', 'cozy'] },
  'main-street-ritual': { world: 'Mystic', moods: ['dark'] },
  'main-street-confetti': { world: 'Playroom', moods: ['playful'] },
  'main-street-bubblegum': { world: 'Playroom', moods: ['playful'] },
  'main-street-sprout': { world: 'Playroom', moods: ['cozy', 'playful'] },
  'main-street-pressroom': { world: 'Press', moods: ['industrial', 'modern'] },
  'main-street-marquee': { world: 'Press', moods: ['modern', 'industrial'] },
  'main-street-broadside': { world: 'Press', moods: ['industrial', 'modern'] },
  'main-street-heirloom': { world: 'Relic', moods: ['rustic'] },
  'main-street-curiosity': { world: 'Relic', moods: ['dark', 'elegant'] },
  'main-street-postmark': { world: 'Relic', moods: ['rustic'] },
};

/** A one-line, plain-language description of each skin — its colors, its type
 *  face, and the world it belongs to. Shown to Bohdi's Graphic Artist (and the
 *  legacy looks menu) so a skin can be chosen by what it actually looks like. */
export const SKIN_DESCRIPTIONS: Record<string, string> = {
  // Hearth — warm, handmade, domestic
  'main-street-ember': 'warm cream and ember, a soft serif — homey, cozy, hand-baked',
  'main-street-orchard': 'golden amber and terracotta, a warm hand-cut serif — harvest evening',
  'main-street-pantry': 'bright kitchen cream and garden green, a sturdy slab — fresh and farm-direct',
  'main-street-hearthstone': 'candlelit dark with ember amber, a high-contrast serif — cozy after dark',
  // Workshop — rugged, made-to-last
  'main-street-tannery': 'dark brown-black leather with aged brass, a sturdy slab — rugged and warm',
  'main-street-forge': 'cold blue-charcoal with mustard, condensed industrial caps — metal and machine',
  'main-street-anvil': 'near-black with a single blood red, heavy blunt caps — butcher-sign bold',
  'main-street-sawdust': 'light oak and wood-stain brown, a clean slab — the daylight woodshop',
  // Fine — refined, quiet, luxe
  'main-street-porcelain': 'blush white and aubergine, a fine hairline serif — romantic and delicate',
  'main-street-atelier': 'bright paper with ink and thin gold, a sharp modern grotesque — clean contemporary luxury',
  'main-street-gild': 'black and thin gold, a high-contrast serif — the lit jewel case',
  // Garden — botanical, earthy, seasonal
  'main-street-botanical': 'oat and deep forest green, a soft optical serif — earthy and seasonal',
  'main-street-conservatory': 'pale leaf-white and garden green, an airy roman serif — the glasshouse',
  'main-street-wildflower': 'warm meadow cream and cosmos pink, a blowsy display serif — bright and seasonal',
  // Studio — art-forward, the goods are the art
  'main-street-studio': 'bone-white gallery wall, huge ink type, one hot vermillion — quiet room, loud art',
  'main-street-darkroom': 'charcoal wall and cold slate, a characterful grotesque — moody gallery',
  'main-street-pigment': 'bright white and hot magenta, a big bold grotesque — for vivid, colorful work',
  // Mystic — esoteric, moody, celestial
  'main-street-nightshade': 'violet-black and electric amethyst with a gold hairline, a carved gothic — deep occult',
  'main-street-celestine': 'pale dawn-lilac and dusk violet, an engraved roman — soft and celestial',
  'main-street-ritual': 'near-black and a single blood red, a dramatic serif — candlelit and intense',
  // Playroom — playful, bright, friendly
  'main-street-confetti': 'butter cream with poppy and grape, a rounded heavy display — bright and playful',
  'main-street-bubblegum': 'cotton-candy white with bubblegum pink and pool cyan, a rounded display — candy loud',
  'main-street-sprout': 'soft pistachio and warm apricot, a gentle rounded sans — the friendly, quiet end of playful',
  // Press — graphic, inky, urban
  'main-street-pressroom': 'bone paper with off-register riso red and blue, condensed poster caps — screenprint',
  'main-street-marquee': 'black with one neon-lime, a wall of poster caps — streetwear and bold',
  'main-street-broadside': 'newsprint gray with stamped red, condensed caps — the raw zine',
  // Relic — vintage, nostalgic, aged
  'main-street-heirloom': 'faded ochre paper, sepia ink, worn teal and oxblood, an old Caslon — found, not made',
  'main-street-curiosity': 'deep wood and brass with a bottle-green band, a Victorian display — the vintage cabinet',
  'main-street-postmark': 'aged paper with retro orange and teal, an ornate display serif — mid-century ephemera',
};

export const MAIN_STREET_FONT_HREFS: Record<string, string> = {
  'main-street-ember':
    'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap',
  'main-street-orchard':
    'https://fonts.googleapis.com/css2?family=Hedvig+Letters+Serif&family=Karla:wght@400;500;600&family=Fragment+Mono&display=swap',
  'main-street-pantry':
    'https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@400;500;600;700&family=Mulish:wght@400;500;600&family=Sometype+Mono:wght@400;500&display=swap',
  'main-street-hearthstone':
    'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Anonymous+Pro:wght@400;700&display=swap',
  'main-street-tannery':
    'https://fonts.googleapis.com/css2?family=Bitter:wght@400;600;800&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap',
  'main-street-forge':
    'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Archivo:wght@400;500;700&family=JetBrains+Mono:wght@500&display=swap',
  'main-street-anvil':
    'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap',
  'main-street-sawdust':
    'https://fonts.googleapis.com/css2?family=Hepta+Slab:wght@400;600;700&family=Public+Sans:wght@400;500;600&family=Overpass+Mono:wght@400;500&display=swap',
  'main-street-porcelain':
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500;600&display=swap',
  'main-street-atelier':
    'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap',
  'main-street-gild':
    'https://fonts.googleapis.com/css2?family=Prata&family=Manrope:wght@400;500;600;700&display=swap',
  'main-street-botanical':
    'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Hanken+Grotesk:wght@400;500;600&family=Space+Mono:wght@400&display=swap',
  'main-street-conservatory':
    'https://fonts.googleapis.com/css2?family=Marcellus&family=Karla:wght@400;500;600&family=Syne+Mono&display=swap',
  'main-street-wildflower':
    'https://fonts.googleapis.com/css2?family=Yeseva+One&family=Mulish:wght@400;500;600&family=Red+Hat+Mono:wght@400;500&display=swap',
  'main-street-studio':
    'https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap',
  'main-street-darkroom':
    'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Geist+Mono:wght@400;500&display=swap',
  'main-street-pigment':
    'https://fonts.googleapis.com/css2?family=Darker+Grotesque:wght@500;700;800;900&family=Mada:wght@400;500;600&family=Sometype+Mono:wght@400;500&display=swap',
  'main-street-nightshade':
    'https://fonts.googleapis.com/css2?family=Gloock&family=Spectral:ital,wght@0,400;0,500;1,400&family=Martian+Mono:wght@400;500&display=swap',
  'main-street-celestine':
    'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Cardo:ital,wght@0,400;0,700;1,400&family=Fragment+Mono&display=swap',
  'main-street-ritual':
    'https://fonts.googleapis.com/css2?family=Eczar:wght@400;600;700&family=Vollkorn:ital,wght@0,400;0,600;1,400&family=Sometype+Mono:wght@400;500&display=swap',
  'main-street-confetti':
    'https://fonts.googleapis.com/css2?family=Unbounded:wght@600;700;800&family=Figtree:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap',
  'main-street-bubblegum':
    'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap',
  'main-street-sprout':
    'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Nunito+Sans:wght@400;600&family=Red+Hat+Mono:wght@400;500&display=swap',
  'main-street-pressroom':
    'https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=Schibsted+Grotesk:wght@400;500;700&family=Spline+Sans+Mono:wght@400;500&display=swap',
  'main-street-marquee':
    'https://fonts.googleapis.com/css2?family=Anton&family=Hanken+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap',
  'main-street-broadside':
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Sans:wght@400;500;600&family=Sometype+Mono:wght@400;500&display=swap',
  'main-street-heirloom':
    'https://fonts.googleapis.com/css2?family=Libre+Caslon+Display&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap',
  'main-street-curiosity':
    'https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Lora:ital,wght@0,400;0,600;1,400&family=Anonymous+Pro:wght@400;700&display=swap',
  'main-street-postmark':
    'https://fonts.googleapis.com/css2?family=Rozha+One&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=Sometype+Mono:wght@400;500&display=swap',
};

export type MainStreetSkinKey = keyof typeof MAIN_STREET_SKINS;
