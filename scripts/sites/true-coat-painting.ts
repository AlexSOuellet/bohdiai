/**
 * True Coat Painting — a MADE-UP painter, the contractor sample for bohdiai.com
 * (Alex, 2026-10-06). Not a real business: the phone is a reserved 555 number,
 * and the reviews, rating, booking line, guarantees and prices are SAMPLE
 * content written to show the layout. Every photo is stock (Unsplash).
 * Wears the atelier design (built to Alex's Stitch reference).
 *
 * `media(name)` resolves a processed media file (see build-contractor-site.ts)
 * to its public storage URL.
 */
import type { ContractorContent } from '../../lib/archetypes/contractor/schemas';
import type { BrandPalette } from '../../lib/color/brand-palette';

export const SITE = {
  subdomain: 'true-coat-painting',
  businessName: 'True Coat Painting',
  /** Near-black buttons and a sage accent, as in the Stitch reference. */
  brandPalette: { base: '#080d13', accent: '#54624e' } satisfies BrandPalette,
};

/** Sample ballpark prices: base range per job and size, scaled by finish. */
const BASE: Record<string, Record<string, [number, number]>> = {
  interior: { small: [900, 1600], mid: [3200, 4800], whole: [6500, 9500] },
  exterior: { small: [2500, 3800], mid: [5500, 8000], whole: [9000, 14000] },
  trim: { small: [600, 1100], mid: [1800, 2900], whole: [3500, 5500] },
  decks: { small: [800, 1400], mid: [1600, 2600], whole: [3000, 4800] },
};
const FINISH: Record<string, number> = { standard: 1, premium: 1.25, restoration: 1.45 };

function dollars(n: number): string {
  return `$${(Math.round(n / 100) * 100).toLocaleString('en-US')}`;
}

function ranges(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [scope, sizes] of Object.entries(BASE)) {
    for (const [size, [lo, hi]] of Object.entries(sizes)) {
      for (const [grade, m] of Object.entries(FINISH)) out[`${scope}|${size}|${grade}`] = `${dollars(lo * m)} – ${dollars(hi * m)}`;
    }
  }
  return out;
}

export function content(media: (file: string) => string): ContractorContent {
  const still = (file: string, alt: string) => ({ kind: 'still' as const, url: media(file), alt });

  return {
    design: 'atelier',
    business: {
      name: 'True Coat',
      trade: 'Painting',
      phone: '(401) 555-0142',
      phoneDial: '+14015550142',
      serviceArea: ['Warwick', 'Cranston', 'East Greenwich', 'Kent County'],
    },
    hero: {
      kicker: 'House painting · Kent County',
      marker: 'Two coats, every time',
      headline: 'Color you can live with for ten years',
      sub: 'Interior and exterior painting, trim, doors and decks across Kent County. We scrape, sand and prime before a drop of color goes on, so the paint holds up to Rhode Island winters.',
      badges: [
        { icon: 'verified_user', label: 'Licensed & insured' },
        { icon: 'workspace_premium', label: '3-year paint guarantee' },
        { icon: 'format_paint', label: 'Two coats, every time' },
      ],
      feature: { label: 'Featured job', title: 'The Pine Room, East Greenwich', tag: 'Two coats · Matte' },
      media: still('green-bedroom.webp', 'A bedroom painted deep green with white trim and a black iron bed'),
      estimateLabel: 'Ballpark price in 60 seconds',
    },
    estimator: {
      eyebrow: 'Ballpark in 60 seconds',
      title: 'What would it cost',
      intro: 'Pick the job, the size and the finish for a rough range. We firm it up once we see it.',
      scopes: [
        { key: 'interior', name: 'Interior', detail: 'Walls, ceilings, trim', icon: 'weekend' },
        { key: 'exterior', name: 'Exterior', detail: 'Clapboard and shingle', icon: 'home' },
        { key: 'trim', name: 'Trim & doors', detail: 'Doors, shutters, railings', icon: 'door_front' },
        { key: 'decks', name: 'Decks & porches', detail: 'Stain or paint', icon: 'deck' },
      ],
      sizes: [
        { key: 'small', name: 'A room or one side' },
        { key: 'mid', name: 'A floor or two sides' },
        { key: 'whole', name: 'The whole house' },
      ],
      grades: [
        { key: 'standard', name: 'Standard', detail: 'Two coats of quality paint, normal prep', note: 'Base' },
        { key: 'premium', name: 'Premium', detail: 'Top-line paint, extra sanding and caulking', note: '+25%' },
        { key: 'restoration', name: 'Restoration', detail: 'Strip, repair and prime old or damaged surfaces', note: '+45%' },
      ],
      ranges: ranges(),
      rangeNote: 'Includes prep and cleanup',
    },
    work: {
      eyebrow: 'Recent work',
      title: 'The finish speaks for itself',
      intro: 'A few jobs from around Kent County, and the colors that went on them.',
      items: [
        {
          media: still('purple-house-crew.webp', 'Two painters on ladders painting a lavender clapboard house'),
          caption: 'Lavender clapboard',
          tag: 'Exterior',
          place: 'Warwick',
          detail: 'Two days of scraping and priming on old clapboard, then two coats and every window sash cut in by hand.',
          swatch: { color: '#b6a7d8', name: 'Color: Lavender Clapboard · Satin' },
        },
        {
          media: still('victorian-blue.webp', 'A blue Victorian house with a white wraparound porch'),
          caption: 'Blue Victorian',
          tag: 'Exterior',
          place: 'East Greenwich',
          detail: 'Body, trim and porch in three colors, with the railings and spindles brushed one at a time.',
          swatch: { color: '#4f6a86', name: 'Color: Victorian Slate · Low lustre' },
        },
        {
          media: still('porch-homes.webp', 'A two-tone house with burgundy shutters and a front porch'),
          caption: 'Two tones, one weekend',
          tag: 'Exterior',
          place: 'Cranston',
          detail: 'New body color, crisp white trim and burgundy shutters, finished over a single long weekend.',
          swatch: { color: '#8b9aa7', name: 'Color: Harbor Grey · Satin' },
        },
      ],
    },
    services: {
      eyebrow: 'What we paint',
      title: 'Prep first, then paint',
      note: 'Every job starts with the boring part: washing, scraping, sanding, caulking and priming.',
      items: [
        {
          name: 'Interior painting',
          detail: 'Walls, ceilings and trim, with floors and furniture covered and the room put back after.',
          photo: still('dining-hall.webp', 'A hallway and dining room in soft teal with white doors'),
          label: 'Inside',
          tags: ['Walls & ceilings', 'Trim', 'Low odor'],
        },
        {
          name: 'Exterior painting',
          detail: 'Clapboard, shingle and trim, scraped, sanded and primed before the color goes on.',
          photo: still('white-colonial.webp', 'A white colonial with black shutters behind a lawn'),
          label: 'Outside',
          tags: ['Full prep', 'Two coats', 'Weather ready'],
        },
        {
          name: 'Trim & detail',
          detail: 'Victorian brackets, window sashes and railings, cut in by hand.',
          photo: still('victorian-trim.webp', 'Ornate Victorian trim picked out in blue and white'),
          label: 'By hand',
          tags: ['Brackets', 'Sashes', 'Railings'],
        },
        {
          name: 'Doors & shutters',
          detail: 'A new color for the front door or the whole set of shutters.',
          photo: still('purple-door.webp', 'A purple front door set in pale green clapboard'),
          label: 'Curb appeal',
          tags: ['Front doors', 'Shutters'],
        },
      ],
    },
    comparison: {
      eyebrow: 'The True Coat way',
      title: 'Why it lasts longer',
      intro: 'Most paint jobs fail because somebody skipped a step. We don’t.',
      themLabel: 'Typical painters',
      usLabel: 'True Coat',
      rows: [
        { topic: 'Prep', them: 'A quick wash and straight to color.', us: 'Scrape, sand, caulk and prime before any color goes on.' },
        { topic: 'Cleanup', them: 'Drips on the walk and tape left on the trim.', us: 'Drop cloths everywhere, and your yard and rooms left the way we found them.' },
        { topic: 'Price', them: 'A low number, then change orders halfway through.', us: 'A written price before we start. What we quote is what you pay.' },
      ],
    },
    reviews: {
      eyebrow: 'Reviews',
      title: 'What customers say',
      rating: { score: '4.9', label: 'Sample rating · 62 reviews' },
      items: [
        {
          quote: 'They spent two full days scraping and priming before they opened a can of color. Three winters later it still looks new.',
          author: 'Sample customer',
          job: 'Exterior · Warwick',
        },
        { quote: 'They taped and covered everything. You would never know a crew had been in the house.', author: 'Sample customer', job: 'Interior · Cranston' },
        { quote: 'I was scared of a purple door. They talked me into it and the whole street loves it.', author: 'Sample customer', job: 'Front door · East Greenwich' },
      ],
      note: 'This is a sample site. These reviews were written to show how real ones look.',
    },
    crew: {
      eyebrow: 'Who shows up',
      quote: 'The paint is the easy part. The prep is the job.',
      attribution: 'Dan Ferreira, owner (sample)',
      body: ['Every job starts with a walk-through and a written price, and ends with the rooms and the yard left the way we found them.'],
      photo: still('hero.webp', 'A painter in white overalls on a ladder, rolling paint high on a wall'),
    },
    banner: { label: 'Booking now', text: 'Scheduling spring exteriors · a few weeks left', tag: 'Sample' },
    area: {
      eyebrow: 'Where we work',
      title: 'Kent County and nearby',
      intro: 'Warwick, Cranston, East Greenwich and the towns around them. Not sure we reach you? Ask, the estimate is free.',
    },
    estimate: {
      eyebrow: 'Free estimate',
      title: 'Tell us what needs painting',
      intro: 'A few details and a couple of photos of the house or the rooms are all we need to price it.',
      steps: ['Send your request, photos help', 'We call or text you back', 'We come out, look, and give you a price'],
      detailsHint: 'Which rooms or sides, what’s there now, and when you’d like it done.',
      states: ['Rhode Island'],
    },
  };
}
