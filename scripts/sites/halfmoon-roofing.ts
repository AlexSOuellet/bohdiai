/**
 * Halfmoon Roofing & Gutters — a MADE-UP roofer, a contractor sample for
 * bohdiai.com (Alex, 2026-10-06). Not a real business: the phone is a reserved
 * 555 number, the reviews are labelled as samples, and every photo is stock
 * (Unsplash).
 *
 * `media(name)` resolves a processed media file (see build-contractor-site.ts)
 * to its public storage URL.
 */
import type { ContractorContent } from '../../lib/archetypes/contractor/schemas';
import type { BrandPalette } from '../../lib/color/brand-palette';

export const SITE = {
  subdomain: 'halfmoon-roofing',
  businessName: 'Halfmoon Roofing & Gutters',
  brandPalette: { base: '#16181c', accent: '#f08a24' } satisfies BrandPalette,
};

export function content(media: (file: string) => string): ContractorContent {
  const still = (file: string, alt: string) => ({ kind: 'still' as const, url: media(file), alt });

  return {
    business: {
      name: 'Halfmoon',
      trade: 'Roofing & Gutters',
      phone: '(401) 555-0187',
      phoneDial: '+14015550187',
      serviceArea: ['Westerly', 'Charlestown', 'South Kingstown', 'Washington County'],
    },
    hero: {
      kicker: 'Roof replacement · Repairs · Gutters',
      marker: 'Off by dark…',
      headline: 'A new roof in a day, the yard clean by supper',
      highlight: 'day',
      sub: 'Asphalt roofs, repairs and gutters along the South County shore. Old roof off, new one on, and every nail picked up with a magnet before we leave.',
      media: still('hero.webp', 'A roofer carrying a bundle of shingles across a roof deck'),
      estimateLabel: 'Get a free estimate',
    },
    work: {
      eyebrow: 'The work',
      title: 'Down to the deck and back up',
      intro: 'Tear-off, new underlayment, new shingles, new gutters. Here is the kind of work we do.',
      items: [
        { media: still('tear-off.webp', 'A roofer prying old shingles off a roof'), caption: 'Old shingles off', tag: 'Tear-off' },
        { media: still('old-roof-off.webp', 'A roofer standing on a stripped roof above a ladder'), caption: 'Down to the deck', tag: 'Tear-off' },
        { media: still('harness-crew.webp', 'Two roofers in harnesses laying new dark shingles'), caption: 'Tied off, laying new', tag: 'Replacement' },
        { media: still('new-shingles.webp', 'A roofer nailing new architectural shingles near the eave'), caption: 'New architectural shingles', tag: 'Replacement' },
        { media: still('finished-roof.webp', 'A finished roof on a large shingled house'), caption: 'Finished, ridge to eave', tag: 'Replacement' },
        { media: still('aerial-new-roof.webp', 'An aerial view of a house with a new grey roof'), caption: 'From above', tag: 'Replacement' },
        { media: still('crew-on-ridge.webp', 'Two roofers working near the ridge of a steep roof'), caption: 'Steep pitch, no problem', tag: 'Repairs' },
        { media: still('dormer.webp', 'A dormer gable framed in a new shingle roof'), caption: 'Dormers and valleys', tag: 'Repairs' },
        { media: still('gutters.webp', 'A close-up of a new metal gutter under the roof edge'), caption: 'Seamless gutters', tag: 'Gutters' },
        { media: still('flat-roof-crew.webp', 'A crew working on a low-slope roof on a corner building'), caption: 'Low-slope and flat', tag: 'Repairs' },
      ],
    },
    services: {
      eyebrow: 'What we do',
      title: 'Everything over your head',
      items: [
        { name: 'Roof replacement', detail: 'Old roof off to the deck, new underlayment, ice and water shield, and new shingles.' },
        { name: 'Roof repairs', detail: 'Leaks, missing shingles, flashing and storm damage, fixed fast.' },
        { name: 'Gutters', detail: 'Seamless gutters and downspouts, sized for nor’easter rain.' },
        { name: 'Skylights & chimneys', detail: 'New flashing where leaks love to start.' },
        { name: 'Inspections', detail: 'Buying or selling? We’ll go up and tell you straight what the roof needs.' },
      ],
    },
    reviews: {
      eyebrow: 'Reviews',
      title: 'What customers say',
      items: [
        {
          quote: 'They had the old roof off by ten and the new one on by four. The magnet sweep after was more thorough than I would have been.',
          author: 'Sample customer',
          job: 'Full replacement, Westerly',
        },
        { quote: 'Came out the morning after the storm, tarped it, and had it fixed by the end of the week.', author: 'Sample customer', job: 'Storm repair' },
        { quote: 'Told me I didn’t need a new roof yet, just flashing. Who does that?', author: 'Sample customer', job: 'Chimney flashing' },
      ],
      note: 'This is a sample site. These reviews were written to show how real ones look.',
    },
    crew: {
      eyebrow: 'Who shows up',
      quote: 'If it’s not dry by dark, we didn’t do our job.',
      attribution: 'Halfmoon Roofing & Gutters',
      body: [
        'Most roofs are one-day jobs, and we plan them that way: the crew is on the roof at seven and your house is closed up before the sun goes down.',
        'Then we walk the yard with a magnet, haul every scrap away, and show you photos of what we found under the old shingles.',
      ],
      photo: still('roof-and-siding.webp', 'The edge of a new dark roof over white siding and roses'),
    },
    area: {
      eyebrow: 'Where we work',
      title: 'The South County shore',
      intro: 'Westerly, Charlestown, South Kingstown and the towns around them. Not sure we reach you? Ask, the estimate is free.',
    },
    estimate: {
      eyebrow: 'Free estimate',
      title: 'Tell us about your roof',
      intro: 'A few details and a photo or two from the ground are all we need to get started.',
      steps: ['Send your request, photos help', 'We call or text you back', 'We go up, look, and give you a price'],
    },
  };
}
