/**
 * The sites bohdiai.com shows: real clients first, then labelled samples.
 * One list feeds the hero browser and the work section, so they can't drift.
 * Screenshots live in public/work/ — re-capture with scripts/capture-work-shots.mjs.
 */
export type WorkKind = 'client' | 'sample';

/** A client's own words, shown beside their site. The first paragraph shows; the rest opens on "Read more". `highlight` must appear verbatim in the first paragraph. */
export type Testimonial = {
  paragraphs: readonly string[];
  highlight: string;
  name: string;
  role: string;
};

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
  testimonials: readonly Testimonial[];
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
    testimonials: [
      {
        paragraphs: [
          'Working with BohdiAI to build my website was an absolute game-changer. Alex delivered an incredible, polished final product in just a single day, and didn’t require much information or time from me.',
          'His level of thoroughness, attention to detail, and efficiency was no stress. I couldn’t be more appreciative of his expertise and hard work. Highly recommend to anyone looking for top-tier web design!',
        ],
        highlight: 'polished final product in just a single day',
        name: 'Sheri Giannattasio',
        role: 'Cut-Pro Lawncare & Construction',
      },
      {
        paragraphs: [
          'Working with Alex was an absolute breeze. As a busy business owner, I don’t have time for endless phone calls and back-and-forth meetings. Alex completely understood that—he knew exactly what questions to ask to get straight to the point and nailed the design right out of the gate.',
          'He built a custom website for our sod and landscaping business that captures exactly who we are. While we pride ourselves on being professional, he took our brand to the next level and made us look incredible online. If you need a streamlined, efficient process and a top-tier website, I couldn’t recommend him enough!',
        ],
        highlight: 'nailed the design right out of the gate',
        name: 'Chris Bullock',
        role: 'Cut-Pro Lawncare & Construction',
      },
    ],
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
    testimonials: [
      {
        paragraphs: [
          'I cannot say enough wonderful things about Alex! Alex designed and built my website from top to bottom, and I truly couldn’t be happier with what he created. He brought my dream of having a website to life.',
          'Alex was knowledgeable, friendly, professional, and incredibly attentive to every detail. He listened to my thoughts, cared about the details, and made sure the finished website truly reflected my vision and my business.',
          'What truly makes Alex stand out is the care and dedication he puts into his work. He doesn’t just build a website—he takes the time to understand your vision and creates something you can be proud of.',
          'If you are looking for a website developer who is talented, creative, dependable, professional, easy to communicate with, and who will genuinely care about your vision and your business, I wholeheartedly recommend Alex. He went above and beyond my expectations, and I would choose him again without hesitation.',
        ],
        highlight: 'He brought my dream of having a website to life',
        name: 'Penny C.',
        role: 'Decoupage Digital Designs · Troy, MO',
      },
    ],
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
    testimonials: [],
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
    testimonials: [],
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
    testimonials: [],
  },
  {
    slug: 'rustic-rhody',
    name: 'Rustic Rhody',
    url: 'https://rustic-rhody.bohdiai.com',
    host: 'rustic-rhody.bohdiai.com',
    kind: 'sample',
    category: 'Rustic',
    blurb: 'Burned-wood flags and signs',
    features: [],
    shot: '/work/rustic-rhody.webp',
    testimonials: [],
  },
];

export const WORK: readonly WorkEntry[] = [...CLIENTS, ...SAMPLES];
