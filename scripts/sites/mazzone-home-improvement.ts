/**
 * Mazzone Home Improvement — a proof-of-concept site Alex is showing Joe Mazzone
 * (2026-10-06). Joe is a renovator in Smithfield, RI, not a roofer (Alex).
 * Facts come from his Google listing; review quotes are his customers' own words
 * from that listing, trimmed, spelling tidied only. Joe decides which stay.
 * The hero is Joe himself, cropped from the photo in his Lil Rhody Online feature
 * (Alex's pick; no Lil Rhody branding). Every other photo is a STOCK stand-in
 * (Unsplash) until Joe sends his own, so no caption claims a picture is his job.
 *
 * `media(name)` resolves a processed media file (see build-contractor-site.ts)
 * to its public storage URL.
 */
import type { ContractorContent } from '../../lib/archetypes/contractor/schemas';
import type { BrandPalette } from '../../lib/color/brand-palette';

export const SITE = {
  subdomain: 'mazzone-home-improvement',
  businessName: 'Mazzone Home Improvement',
  /** Navy and gold, from the colors on his job-site sign. */
  brandPalette: { base: '#0f1b2d', accent: '#d9a441' } satisfies BrandPalette,
};

export function content(media: (file: string) => string): ContractorContent {
  const still = (file: string, alt: string) => ({ kind: 'still' as const, url: media(file), alt });

  return {
    business: {
      name: 'Mazzone',
      trade: 'Home Improvement',
      phone: '(401) 559-2511',
      phoneDial: '+14015592511',
      email: 'waterloovri@aol.com',
      serviceArea: ['Smithfield', 'Rhode Island'],
    },
    hero: {
      kicker: 'Kitchens · Baths · Floors · Siding · Windows · Decks',
      marker: 'Come home to it…',
      headline: 'Love the house you already live in',
      highlight: 'Love',
      sub: 'Kitchens, baths, floors and whole-house renovations across Rhode Island. Joe comes out himself, listens to what you want, and is up front about the cost and the wait.',
      media: still('hero-joe.webp', 'Joe Mazzone in his Mazzone Home Improvement hoodie, arms crossed, in front of a house'),
      estimateLabel: 'Get a free estimate',
    },
    work: {
      eyebrow: 'The work',
      title: 'Every room in the house',
      intro: 'A kitchen, a bath, new floors or the whole first floor opened up. One crew, start to finish.',
      items: [
        { media: still('hero-kitchen-remodel.webp', 'A kitchen in the middle of a remodel, new cabinets in and wrapped in plastic'), caption: 'Mid-remodel', tag: 'Kitchens' },
        { media: still('kitchen-farmhouse.webp', 'A white farmhouse kitchen with a deep sink under the window'), caption: 'Farmhouse kitchen', tag: 'Kitchens' },
        { media: still('bath-glass-shower.webp', 'A bright bathroom with a glass shower and a long white vanity'), caption: 'Glass shower, double vanity', tag: 'Baths' },
        { media: still('open-floor-plan.webp', 'An open living space with new hardwood floors and fresh white walls'), caption: 'Walls out, floors in', tag: 'Renovations' },
        { media: still('kitchen-builtins.webp', 'Kitchen built-ins with glass-front cabinets and open shelves'), caption: 'Built-ins and shelving', tag: 'Kitchens' },
        { media: still('trim-work.webp', 'A carpenter cutting trim at a miter saw inside a bright room'), caption: 'Trim, cut on site', tag: 'Carpentry' },
        { media: still('colonial-siding.webp', 'A white New England colonial with black shutters'), caption: 'Siding and windows', tag: 'Exteriors' },
        { media: still('deck-cedar.webp', 'A large two-level cedar deck with planters on the back of a green house'), caption: 'Two-level cedar deck', tag: 'Decks' },
        { media: still('cottage-siding.webp', 'A small cottage freshly sided in bright teal'), caption: 'New siding, new color', tag: 'Exteriors' },
      ],
    },
    services: {
      eyebrow: 'What we do',
      title: 'If it’s in your house, Joe does it',
      items: [
        { name: 'Kitchens', detail: 'Cabinets, counters, floors and layout, from a refresh to a full gut.' },
        { name: 'Bathrooms', detail: 'Showers, tubs, tile and vanities, done right the first time.' },
        { name: 'Whole-house renovations', detail: 'Walls moved, rooms opened up, even stairs relocated.' },
        { name: 'Flooring', detail: 'Hardwood, tile and more, laid tight and level.' },
        { name: 'Siding & windows', detail: 'A tighter, better-looking house from the outside in.' },
        { name: 'Decks', detail: 'New decks built solid, old ones made safe again.' },
        { name: 'Gutter protection', detail: 'Waterloov gutter guards that keep the leaves out and the water moving.' },
        { name: 'Repairs', detail: 'The jobs on your list that never seem to get done.' },
      ],
    },
    reviews: {
      eyebrow: 'Reviews',
      title: 'What his customers say',
      items: [
        {
          quote: 'Joe came in, listened to our plans and then made a few suggestions of his own. And what he suggested is what our dreams were made of! After 10 years in our house, it’s nice to be able to come home.',
          author: 'Robin L.',
          job: 'Total renovation: stairs moved, new kitchen, living and dining',
        },
        {
          quote: 'Mine was a window project and it was completed in 2 days. He did a beautiful job and I would definitely call on him again!',
          author: 'Tina',
          job: 'Windows',
        },
        {
          quote: 'I highly recommend Mazzone Home Improvement. He does everything: bathrooms, kitchens, you name it, he does it.',
          author: 'Steven G.',
          job: 'Home improvement',
        },
        { quote: 'Great attention to detail! Can do it all. Up front about lead time and costs. Highly recommend.', author: 'Dr. Jeff R.' },
        { quote: 'Joe runs a very well-oiled operation and does great work. His crew is professional.', author: 'Ayed A.' },
      ],
      note: 'Reviews left by customers on Google.',
    },
    crew: {
      eyebrow: 'Who shows up',
      quote: 'Joe came in, listened to our plans and then made a few suggestions of his own.',
      attribution: 'Robin L. — homeowner',
      body: [
        'When you call Mazzone Home Improvement, you get Joe. He comes out to see the job himself, gives you a straight answer on cost and timing, and brings ideas of his own.',
        'Then his crew does the work, keeps the place clean, and Joe checks in after to make sure everything is right.',
      ],
      photo: still('hands-at-work.webp', 'A carpenter’s hands guiding a router along a board'),
    },
    area: {
      eyebrow: 'Where we work',
      title: 'Smithfield and all of Rhode Island',
      intro: 'Based in Smithfield and working across the state. Not sure we reach you? Ask, the estimate is free.',
    },
    estimate: {
      eyebrow: 'Free estimate',
      title: 'Tell Joe about your project',
      intro: 'A few details and some photos of the room or the house are all he needs to get started.',
      steps: ['Send your request, photos help', 'Joe calls or texts you back', 'He comes out, looks, and gives you a price'],
    },
  };
}
