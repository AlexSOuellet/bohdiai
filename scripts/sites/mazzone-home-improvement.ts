/**
 * Mazzone Home Improvement — a proof-of-concept site Alex is showing Joe Mazzone
 * (2026-10-06). Joe is a renovator in Smithfield, RI, not a roofer (Alex).
 * Facts come from his Google listing; review quotes are his customers' own words
 * from that listing, trimmed, spelling tidied only. Joe decides which stay.
 * The hero is Joe himself, cropped from the photo in his Lil Rhody Online feature
 * (Alex's pick; no Lil Rhody branding). Every other photo is a STOCK stand-in
 * (Unsplash) until Joe sends his own, so no caption claims a picture is his job.
 * Wears the harbor design (Alex's Stitch reference for Joe), real facts only:
 * no registration number, review count, warranty or price claims until Joe gives them.
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
    design: 'harbor',
    business: {
      name: 'Mazzone',
      trade: 'Home Improvement',
      phone: '(401) 559-2511',
      phoneDial: '+14015592511',
      email: 'waterloovri@aol.com',
      serviceArea: ['Smithfield', 'Rhode Island'],
    },
    hero: {
      kicker: 'Home improvement · Smithfield, RI',
      marker: 'Come home to it…',
      headline: 'Love the house you already live in',
      sub: 'Kitchens, baths, floors and whole-house renovations across Rhode Island. Joe comes out himself, listens to what you want, and is up front about the cost and the wait.',
      badges: [
        { icon: 'star', label: '4.5 on Google', sub: 'From his customers' },
        { icon: 'location_on', label: 'Smithfield, RI', sub: 'Working across the state' },
        { icon: 'home_work', label: 'One crew', sub: 'Every room in the house' },
      ],
      media: still('hero-kitchen.webp', 'A bright white farmhouse kitchen with a deep sink under the window'),
      cutout: still('joe-cutout.webp', 'Joe Mazzone in his Mazzone Home Improvement hoodie, arms crossed'),
      estimateLabel: 'Get a free estimate',
    },
    work: {
      eyebrow: 'The work',
      title: 'The kind of work Joe does',
      intro: 'A kitchen, a bath, new floors or the whole first floor opened up. One crew, start to finish. (Example photos until Joe’s own are in.)',
      items: [
        { media: still('hero-kitchen-remodel.webp', 'A kitchen in the middle of a remodel, new cabinets in and wrapped in plastic'), caption: 'Mid-remodel', tag: 'Kitchens' },
        { media: still('trim-work.webp', 'A carpenter cutting trim at a miter saw inside a bright room'), caption: 'Trim, cut on site', tag: 'Carpentry' },
        { media: still('deck-cedar.webp', 'A large two-level cedar deck with planters on the back of a green house'), caption: 'Two-level cedar deck', tag: 'Decks' },
        { media: still('cottage-siding.webp', 'A small cottage freshly sided in bright teal'), caption: 'New siding, new color', tag: 'Exteriors' },
      ],
    },
    services: {
      eyebrow: 'What we do',
      title: 'If it’s in your house, Joe does it',
      items: [
        {
          name: 'Kitchens',
          detail: 'Cabinets, counters, floors and layout, from a refresh to a full gut.',
          icon: 'countertops',
          photo: still('kitchen-builtins.webp', 'Kitchen built-ins with glass-front cabinets and open shelves'),
          tags: ['Cabinets', 'Counters', 'Layout'],
        },
        {
          name: 'Bathrooms',
          detail: 'Showers, tubs, tile and vanities, done right the first time.',
          icon: 'bathtub',
          photo: still('bath-glass-shower.webp', 'A bright bathroom with a glass shower and a long white vanity'),
          tags: ['Showers', 'Tile', 'Vanities'],
        },
        {
          name: 'Whole-house renovations',
          detail: 'Walls moved, rooms opened up, even stairs relocated.',
          icon: 'home_work',
          photo: still('open-floor-plan.webp', 'An open living space with new hardwood floors and fresh white walls'),
          tags: ['Open layouts', 'Stairs moved'],
        },
        {
          name: 'Siding & windows',
          detail: 'A tighter, better-looking house from the outside in.',
          icon: 'window',
          photo: still('colonial-siding.webp', 'A white New England colonial with black shutters'),
          tags: ['Siding', 'Windows'],
        },
        { name: 'Flooring', detail: 'Hardwood, tile and more, laid tight and level.', icon: 'grid_on' },
        { name: 'Decks', detail: 'New decks built solid, old ones made safe again.', icon: 'deck' },
        { name: 'Gutter protection', detail: 'Waterloov gutter guards that keep the leaves out and the water moving.', icon: 'water_drop' },
        { name: 'Repairs', detail: 'The jobs on your list that never seem to get done.', icon: 'handyman' },
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
      rating: { score: '4.5', label: 'On Google' },
    },
    crew: {
      eyebrow: 'Who shows up',
      quote: 'When you call, you get Joe',
      attribution: 'Joe Mazzone, owner',
      promises: [
        { icon: 'person', title: 'You deal with Joe', text: 'He comes out to see the job himself and brings ideas of his own.' },
        { icon: 'receipt_long', title: 'Straight answers', text: 'Up front about the cost and how long you’ll wait, before anything starts.' },
        { icon: 'cleaning_services', title: 'A clean job site', text: 'His crew keeps the place clean and leaves it better than they found it.' },
        { icon: 'verified', title: 'He checks in after', text: 'After the job, and after a big rain, Joe calls to make sure everything is right.' },
      ],
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
      detailsHint: 'What the room is like now, what you’d like it to be, and when.',
      states: ['Rhode Island'],
    },
  };
}
