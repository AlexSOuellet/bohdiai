/**
 * The sites bohdiai.com shows: real clients first, then labelled samples.
 * One list feeds the hero browser and the work section, so they can't drift.
 * Screenshots live in public/work/ — re-capture with scripts/capture-work-shots.mjs.
 */
export type WorkKind = 'client' | 'sample';

export type WorkEntry = {
  slug: string;
  name: string;
  url: string;
  host: string;
  kind: WorkKind;
  /** "Contractor", "Maker", or the sample's look ("Cozy"). */
  category: string;
  blurb: string;
  features: readonly string[];
  /** Path under public/. */
  shot: string;
};

export const CLIENTS: readonly WorkEntry[] = [
  {
    slug: 'cut-pro-lawncare',
    name: 'Cut-Pro Lawncare & Construction',
    url: 'https://cut-pro-lawncare.bohdiai.com',
    host: 'cut-pro-lawncare.bohdiai.com',
    kind: 'client',
    category: 'Contractor',
    blurb:
      'Sod, grading and drainage across Rhode Island, Massachusetts and Connecticut. A bold one-page site built around their own job photos, with an estimate form that lets customers send pictures of their yard.',
    features: ['One-page site', 'Job photos & video', 'Estimate form with photos'],
    shot: '/work/cut-pro-lawncare.webp',
  },
  {
    slug: 'decodigitaldesigns',
    name: 'Decoupage Digital Designs',
    url: 'https://decodigitaldesigns.com',
    host: 'decodigitaldesigns.com',
    kind: 'client',
    category: 'Maker',
    blurb:
      'Penny’s decoupage designs, in a full online shop with collections, a gallery, a cart and checkout, on her own domain.',
    features: ['Online shop', 'Collections & gallery', 'Own domain'],
    shot: '/work/decodigitaldesigns.webp',
  },
];

export const SAMPLES: readonly WorkEntry[] = [
  {
    slug: 'classic-loafs',
    name: 'Classic Loafs',
    url: 'https://classic-loafs.bohdiai.com',
    host: 'classic-loafs.bohdiai.com',
    kind: 'sample',
    category: 'Cozy',
    blurb: 'A small-town bakery',
    features: [],
    shot: '/work/classic-loafs.webp',
  },
  {
    slug: 'twilight-to-darkness',
    name: 'Twilight to Darkness',
    url: 'https://twilight-to-darkness.bohdiai.com',
    host: 'twilight-to-darkness.bohdiai.com',
    kind: 'sample',
    category: 'Dark',
    blurb: 'Hand-poured candles',
    features: [],
    shot: '/work/twilight-to-darkness.webp',
  },
  {
    slug: 'heavenly-scents',
    name: 'Heavenly Scents',
    url: 'https://heavenly-scents.bohdiai.com',
    host: 'heavenly-scents.bohdiai.com',
    kind: 'sample',
    category: 'Modern',
    blurb: 'A floral studio',
    features: [],
    shot: '/work/heavenly-scents.webp',
  },
];

export const WORK: readonly WorkEntry[] = [...CLIENTS, ...SAMPLES];
