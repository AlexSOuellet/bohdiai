/**
 * Saltmarsh & Lace — the made-up demo shop (Saltmarsh & Lace demo spec): Lena
 * Brightman, paint counter in Bristol, decoupage across bottles, boards, boxes,
 * ornaments and oyster dishes. Starts at Showcase; later stages move it up the
 * plans. The photos are generated in the style of two Etsy shops Alex chose as
 * models, never copies. Built by scripts/build-card-site.ts.
 */
import type { ProfileForm } from '../../lib/backend/profile/profile-form';
import type { CardSiteModule } from '../build-card-site';

export const SITE: CardSiteModule['SITE'] = {
  subdomain: 'saltmarsh-and-lace',
  businessName: 'Saltmarsh & Lace',
  // The shoreline design (its own look). Family and skin are stored but unread by it.
  design: 'shoreline',
  family: 'rustic',
  skin: 'main-street-sawdust',
  // Starts at Showcase; the plan switch (stage two) moves it up and down.
  plan: 'showcase',
};

export const PROFILE: ProfileForm = {
  kicker: 'Decoupage and altered art from Bristol, Rhode Island',
  headline: 'Bottles, boards, boxes, ornaments and oyster dishes, sealed to last',
  aboutTitle: 'From the paint counter',
  bio: [
    'By day I run the paint counter at our family hardware store in Bristol. All day long people ask me if something will stick to glass, or hold up on wood, or survive the dishwasher.',
    'I bought my first pack of decoupage papers to answer one of those questions properly. I tried it on an empty bottle behind the counter, and the customer bought the bottle.',
    'Now I work after closing in the back room, between the paint cans. Every sealer on our shelves gets tested before it goes on a piece, so what you take home holds up.',
    'Summers belong to the red, white and blue line, because Bristol’s Fourth of July is the biggest week of my year. The salt marsh past our loading dock is where the name comes from.',
  ].join('\n\n'),
  signature: 'Lena',
  makes: ['Art bottles', 'Boards and trays', 'Oyster dishes'],
  phone: '',
  // Sample sites point their Facebook button at BohdiAI's own page (Alex, 2026-10-05).
  facebookUrl: 'https://www.facebook.com/bohdiai',
  instagramUrl: '',
};

/** In site order; the first opens the shelf. */
export const PHOTOS: CardSiteModule['PHOTOS'] = [
  { file: 'oyster1.jpg', caption: 'Cabbage rose oyster dish' },
  { file: 'bottle1.jpg', caption: 'The lady in amber' },
  { file: 'board1.jpg', caption: 'Lemon blossom board' },
  { file: 'oyster3.jpg', caption: 'Lighthouse ring dish' },
  { file: 'box1.jpg', caption: 'Bay chart keepsake box' },
  { file: 'ornament1.jpg', caption: 'Old Saint Nick' },
  { file: 'scallop1.jpg', caption: 'Blue toile scallop tray' },
  { file: 'patriot1.jpg', caption: 'Fourth of July bottle' },
  { file: 'tray1.jpg', caption: 'Midnight garden tray' },
  { file: 'oyster2.jpg', caption: 'Sea chart oyster trio' },
  { file: 'jar1.jpg', caption: 'Lace and roses lantern' },
  { file: 'ornament2.jpg', caption: 'Carol star' },
];

/** Made-up market dates for the sample. */
export const DATES = [
  { date: '2026-10-24', endDate: '', name: 'Harvest Fair at Colt State Park', town: 'Bristol' },
  { date: '2026-11-14', endDate: '', name: 'Holiday Makers Market', town: 'Warren' },
  { date: '2026-12-05', endDate: '2026-12-06', name: 'Christmas Fair at the Grange', town: 'Barrington' },
  { date: '2026-12-19', endDate: '', name: 'Last-Minute Gift Market', town: 'Tiverton' },
];
