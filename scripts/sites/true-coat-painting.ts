/**
 * True Coat Painting — a MADE-UP painter, the contractor sample for bohdiai.com
 * (Alex, 2026-10-06). Not a real business: the phone is a reserved 555 number,
 * the reviews are labelled as samples, and every photo is stock (Unsplash).
 *
 * `media(name)` resolves a processed media file (see build-contractor-site.ts)
 * to its public storage URL.
 */
import type { ContractorContent } from '../../lib/archetypes/contractor/schemas';
import type { BrandPalette } from '../../lib/color/brand-palette';

export const SITE = {
  subdomain: 'true-coat-painting',
  businessName: 'True Coat Painting',
  brandPalette: { base: '#14202b', accent: '#e8734a' } satisfies BrandPalette,
};

export function content(media: (file: string) => string): ContractorContent {
  const still = (file: string, alt: string) => ({ kind: 'still' as const, url: media(file), alt });

  return {
    business: {
      name: 'True Coat',
      trade: 'Painting',
      phone: '(401) 555-0142',
      phoneDial: '+14015550142',
      serviceArea: ['Warwick', 'Cranston', 'East Greenwich', 'Kent County'],
    },
    hero: {
      kicker: 'Exteriors · Interiors · Trim · Doors',
      marker: 'Two coats, every time…',
      headline: 'Color you can live with for ten years',
      highlight: 'Color',
      sub: 'House painting inside and out across Kent County. We scrape, sand and prime before a drop of color goes on, so the paint holds up to Rhode Island winters.',
      media: still('hero.webp', 'A painter in white overalls on a ladder, rolling paint high on a wall'),
      estimateLabel: 'Get a free estimate',
    },
    work: {
      eyebrow: 'The work',
      title: 'Outside, inside, and every bit of trim',
      intro: 'Old clapboard, Victorian trim, a front door that needs a little courage. Here is the kind of work we do.',
      items: [
        { media: still('purple-house-crew.webp', 'Two painters on ladders painting a lavender clapboard house'), caption: 'Full exterior, two ladders', tag: 'Exteriors' },
        { media: still('white-colonial.webp', 'A white colonial with black shutters behind a lawn'), caption: 'Classic white and black', tag: 'Exteriors' },
        { media: still('victorian-trim.webp', 'Ornate Victorian trim picked out in blue and white'), caption: 'Victorian trim, by hand', tag: 'Trim' },
        { media: still('purple-door.webp', 'A purple front door set in pale green clapboard'), caption: 'A front door with nerve', tag: 'Doors' },
        { media: still('green-bedroom.webp', 'A bedroom painted deep green with white trim'), caption: 'Deep green bedroom', tag: 'Interiors' },
        { media: still('porch-green.webp', 'A sage green Victorian porch with white railings'), caption: 'Porch and railings', tag: 'Exteriors' },
        { media: still('victorian-blue.webp', 'A blue Victorian house with a white wraparound porch'), caption: 'Blue with white trim', tag: 'Exteriors' },
        { media: still('dining-hall.webp', 'A hallway and dining room in soft teal with white doors'), caption: 'Hall and dining room', tag: 'Interiors' },
        { media: still('porch-homes.webp', 'A two-tone house with burgundy shutters and a front porch'), caption: 'Two tones, one weekend', tag: 'Exteriors' },
        { media: still('fresh-coat.webp', 'A roller laying a fresh coat of blue paint over white'), caption: 'The first coat', tag: 'Interiors' },
      ],
    },
    services: {
      eyebrow: 'What we do',
      title: 'Prep first, then paint',
      items: [
        { name: 'Exterior painting', detail: 'Clapboard, shingle and trim, scraped, sanded and primed before the color goes on.' },
        { name: 'Interior painting', detail: 'Walls, ceilings and trim, with floors and furniture covered and the room put back after.' },
        { name: 'Trim & detail', detail: 'Victorian brackets, window sashes and railings, cut in by hand.' },
        { name: 'Doors & shutters', detail: 'A new color for the front door or the whole set of shutters.' },
        { name: 'Decks & porches', detail: 'Stain or paint, stripped and sealed so it lasts the season.' },
        { name: 'Color help', detail: 'Bring a photo you love; we’ll bring the swatches and test patches.' },
      ],
    },
    reviews: {
      eyebrow: 'Reviews',
      title: 'What customers say',
      items: [
        {
          quote: 'They spent two full days scraping and priming before they opened a can of color. Three winters later it still looks new.',
          author: 'Sample customer',
          job: 'Exterior, Cape in Warwick',
        },
        { quote: 'They taped and covered everything. You would never know a crew had been in the house.', author: 'Sample customer', job: 'Interior, three rooms' },
        { quote: 'I was scared of a purple door. They talked me into it and the whole street loves it.', author: 'Sample customer', job: 'Front door and shutters' },
      ],
      note: 'This is a sample site. These reviews were written to show how real ones look.',
    },
    crew: {
      eyebrow: 'Who shows up',
      quote: 'The paint is the easy part. The prep is the job.',
      attribution: 'True Coat Painting',
      body: [
        'Most paint jobs fail because somebody skipped the scraping. We don’t. Every job starts with the boring part: washing, scraping, sanding, caulking and priming.',
        'Then two coats of good paint, clean lines, and a crew that leaves your yard and your rooms the way they found them.',
      ],
      photo: still('painter-bucket.webp', 'A painter on a ladder with a bucket, brushing paint onto a wall'),
    },
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
    },
  };
}
