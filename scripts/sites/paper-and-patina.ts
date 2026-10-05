/**
 * Paper & Patina — a made-up mixed-media artist (decoupage furniture flips,
 * trays, boxes and canvases: the work Penny's papers go on), the show reel
 * sample site. Photos generated with fal.ai (tmp/samples/paper-and-patina).
 * Built by scripts/build-card-site.ts.
 */
import type { ProfileForm } from '../../lib/backend/profile/profile-form';
import type { CardSiteModule } from '../build-card-site';

export const SITE: CardSiteModule['SITE'] = {
  subdomain: 'paper-and-patina',
  businessName: 'Paper & Patina',
  design: 'showreel',
  // Family and skin are only read by the pinned prints design.
  family: 'cheerful',
  skin: 'main-street-confetti',
};

export const PROFILE: ProfileForm = {
  kicker: 'Mixed media in Warwick, RI',
  headline: 'Tired old furniture and plain pieces, reborn in layers of paper, paint and pattern',
  aboutTitle: 'Nothing is too far gone',
  bio: [
    'I find the dressers nobody wants, the trays at the bottom of the yard-sale box, the boxes with a broken hinge. Then I sand, paint and layer them with papers until they look like they were always meant to be that way.',
    'Every piece is one of a kind. I choose the papers for the piece, not the other way around, so no two ever match.',
    'Have something of your own that deserves a second life? Tell me about it and we’ll make a plan.',
  ].join('\n\n'),
  signature: 'Dana',
  makes: ['Furniture flips', 'Decoupage', 'Mixed media'],
  phone: '',
  // The sample points its Facebook button at BohdiAI's own page (Alex, 2026-10-05).
  facebookUrl: 'https://www.facebook.com/Bohdiai/',
  instagramUrl: '',
};

/** In site order; the first opens the page. */
export const PHOTOS: CardSiteModule['PHOTOS'] = [
  { file: 'm01.jpg', caption: 'The studio' },
  { file: 'm02.jpg', caption: 'Peony dresser' },
  { file: 'm03.jpg', caption: 'French botanical tray' },
  { file: 'm04.jpg', caption: 'Garden collage' },
  { file: 'm05.jpg', caption: 'Butterfly jewelry box' },
  { file: 'm06.jpg', caption: 'Tropical nightstand' },
  { file: 'm07.jpg', caption: 'Wanderlust suitcase' },
  { file: 'm08.jpg', caption: 'Wildflower jars' },
  { file: 'm09.jpg', caption: 'Lemon blossom clock' },
  { file: 'm10.jpg', caption: 'Cottage rose bench' },
];

/** Made-up market dates for the sample (scripts add them; the owner manages them after). */
export const DATES = [
  { date: '2026-10-24', name: 'Fall Festival of Crafts', town: 'Warwick' },
  { date: '2026-11-14', name: 'Makers Mill Market', town: 'Pawtucket' },
  { date: '2026-12-13', name: 'Holiday Craft Show', town: 'Providence' },
];
