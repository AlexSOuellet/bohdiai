/**
 * Cut-Pro Lawncare & Construction — the hand-built site's content.
 * Words drafted by Claude from the business's own sources (their flyer, their
 * Facebook page, their 2024 Angi reviews) for Alex to edit. Review quotes are
 * the customers' own words with spelling/punctuation tidied only.
 *
 * `media(name)` resolves a processed media file (see build-contractor-site.ts)
 * to its public storage URL.
 */
import type { ContractorContent } from '../../lib/archetypes/contractor/schemas';
import type { BrandPalette } from '../../lib/color/brand-palette';

export const SITE = {
  subdomain: 'cut-pro-lawncare',
  businessName: 'Cut-Pro Lawncare & Construction',
  brandPalette: { base: '#0b0b0b', accent: '#3dae3f' } satisfies BrandPalette,
};

export function content(media: (file: string) => string): ContractorContent {
  const still = (file: string, alt: string) => ({ kind: 'still' as const, url: media(file), alt });
  const clip = (file: string, alt: string) => ({
    kind: 'video' as const,
    url: media(`${file}.mp4`),
    poster: media(`${file}-poster.webp`),
    alt,
  });

  return {
    business: {
      name: 'Cut-Pro',
      trade: 'Lawncare & Construction',
      phone: '(401) 206-1566',
      phoneDial: '+14012061566',
      email: 'cutprochris@gmail.com',
      serviceArea: ['Rhode Island', 'Massachusetts', 'Connecticut'],
    },
    hero: {
      kicker: 'Sod · Grading · Loam · Drainage · Stonework',
      marker: 'Until we lay it down…',
      headline: 'The grass will always be greener on the other side',
      highlight: 'greener',
      sub: 'New lawns built from the dirt up — old grass out, ground graded, loam down, fresh sod laid and rolled. By a crew that shows up when we say we will.',
      media: clip('hero-laying-sod', 'A Cut-Pro crew member laying rolls of fresh sod, pallets stacked behind him'),
      estimateLabel: 'Get a free estimate',
    },
    proof: [
      { figure: '2009', label: 'In business since' },
      { figure: '7:45', label: 'Arrival for an 8:00 start' },
      { figure: '3 days', label: 'On a job quoted for a week' },
      { figure: '5.0', label: 'Stars on every review' },
    ],
    work: {
      eyebrow: 'The work',
      title: 'Bare dirt to finished lawn',
      intro: 'Every picture here is a Cut-Pro job. No stock photos — graded, loamed, laid and rolled by our crew.',
      items: [
        { media: clip('clip-graded-lot', 'A new build graded and ready for sod'), caption: 'Graded and ready', tag: 'Grading' },
        { media: still('sod-fence-line.webp', 'Fresh sod being rolled out along a fence line'), caption: 'Rolling it out', tag: 'Sod' },
        { media: still('stone-path.webp', 'A natural stone walkway leading into new lawn'), caption: 'Stone walk into new turf', tag: 'Stonework' },
        { media: clip('clip-sod-by-house', 'Rolls of sod in a wheelbarrow beside a newly sodded yard'), caption: 'Laying a new build', tag: 'Sod' },
        { media: still('striped-lawn.webp', 'A finished front lawn with fresh mowing stripes'), caption: 'First mow, first stripes', tag: 'Sod' },
        { media: still('grading-chris.webp', 'A Cut-Pro crew member raking and grading a bed beside a machine bucket'), caption: 'Grading by hand', tag: 'Grading' },
        { media: clip('clip-backyard-sod', 'A backyard freshly covered in new sod along a wood fence'), caption: 'Backyard, done', tag: 'Sod' },
        { media: still('stripes-close.webp', 'Close-up of thick new turf with mowing stripes'), caption: 'Premium turf, up close', tag: 'Sod' },
        { media: still('new-sod-yard.webp', 'A yard of brand-new sod on its first day'), caption: 'Day one', tag: 'Sod' },
        { media: clip('clip-finished-lawn', 'A new-build site being prepared for a lawn'), caption: 'Site prep', tag: 'Grading' },
        { media: still('bobcat.webp', 'The Cut-Pro compact track loader on a job'), caption: 'Bringing the machine', tag: 'Grading' },
      ],
    },
    services: {
      eyebrow: 'What we do',
      title: 'From the dirt up',
      items: [
        { name: 'Grass removal', detail: 'Old, tired or weedy turf stripped out and hauled away.' },
        { name: 'Grading', detail: 'The ground shaped right, so water runs away from the house instead of into it.' },
        { name: 'Loam', detail: 'A proper bed of loam, so new grass has something real to root into.' },
        { name: 'New sod installs', detail: 'Premium turf laid tight and rolled in — a finished lawn the day we leave.' },
        { name: 'Drainage', detail: 'Soggy corners and washouts fixed at the source.' },
        { name: 'Stonework & patios', detail: 'Walkways, steps and patios in natural stone and pavers.' },
      ],
      note: 'We proudly use premium turf sourced from top local growers, installed professionally by our expert crew.',
    },
    reviews: {
      eyebrow: 'Reviews',
      title: 'Five stars. Every one.',
      items: [
        {
          quote: 'I went through three landscapers. I’m picky and a pain in the butt when it comes to my yard. With that being said, Cut-Pro nailed it.',
          author: 'Lisa R.',
          job: 'Pavers, stonework & new sod',
        },
        {
          quote: 'The owner came to the house himself. He said they would start at 8 o’clock and they were there at 7:45. Explained everything thoroughly before they started. Finished the job in 3 days instead of the week he told me.',
          author: 'Frank G.',
          job: 'Stonework, new sod & paver walkway',
        },
        {
          quote: 'We received excellent service with our sod installation. Our lawn looks phenomenal, and after installation we were always asked if the sod was growing in full.',
          author: 'Angi customer',
          job: 'Sod removal & installation',
        },
        {
          quote: 'Perfect. Great work. Quality materials and the price to match anyone’s. Chris is great, and he actually finished ahead of schedule.',
          author: 'Angi customer',
          job: 'Sod removal & installation',
        },
        {
          quote: 'From start to finish they were very professional, and the quality of the work was excellent.',
          author: 'Elizabeth N.',
          job: 'Removal & installation of sod',
        },
        { quote: 'Excellent work! Friendly and professional.', author: 'Christina A.', job: 'Landscaping & paver patio' },
      ],
      note: 'Reviews left by customers on Angi, 2024.',
    },
    crew: {
      eyebrow: 'Who shows up',
      quote: 'We listen to our customers and SHOW UP!',
      attribution: 'Chris Bullock — Owner',
      body: [
        'Cut-Pro has been building lawns since 2009. When you call, you get Chris. He comes out to look at the job himself, walks you through what it needs, and tells you when the crew will be there.',
        'Then the crew is there when he said they would be.',
      ],
      photo: still('crew.webp', 'Two of the Cut-Pro team in the truck'),
      inset: { media: still('site-supervisor.webp', 'The Cut-Pro dog wearing a Cut-Pro beanie'), caption: 'Site supervisor' },
    },
    area: {
      eyebrow: 'Where we work',
      title: 'Three states, one crew',
      intro: 'We take on jobs across Rhode Island, Massachusetts and Connecticut. Not sure we reach you? Ask — the estimate is free.',
    },
    estimate: {
      eyebrow: 'Free estimate',
      title: 'Tell us about your yard',
      intro: 'A few details and some photos of the space are all we need to get started.',
      steps: ['Send your request — photos help', 'Chris calls or texts you back', 'He comes out, looks, and gives you a price'],
    },
  };
}
