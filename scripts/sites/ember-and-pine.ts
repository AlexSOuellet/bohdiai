/**
 * Ember & Pine — a made-up wood-burner (charred cedar, pyrography and burned
 * house signs), the torch sample site. Photos generated with fal.ai
 * (tmp/samples/ember-and-pine). Built by scripts/build-card-site.ts.
 */
import type { ProfileForm } from '../../lib/backend/profile/profile-form';
import type { CardSiteModule } from '../build-card-site';

export const SITE: CardSiteModule['SITE'] = {
  subdomain: 'ember-and-pine',
  businessName: 'Ember & Pine',
  design: 'torch',
  // Family and skin are only read by the pinned prints design.
  family: 'rustic',
  skin: 'main-street-sawdust',
};

export const PROFILE: ProfileForm = {
  kicker: 'Burned by hand on Aquidneck Island',
  headline: 'Charred cedar, pyrography and burned house signs, made with fire and a steady hand',
  aboutTitle: 'Fire is my favorite tool',
  bio: [
    'Some of what I make starts with a torch and ends with a board burned black as coal. Some starts with a pen-thin burner and takes forty hours of shading, one line at a time.',
    'Either way, the wood has the last word. The grain decides where the char cracks and where the light comes through, and I follow it.',
    'Want your dog, your family name or your favorite mountain burned into something that will outlast all of us? Tell me about it.',
  ].join('\n\n'),
  signature: 'Jen',
  makes: ['Shou sugi ban', 'Pyrography', 'House signs'],
  phone: '',
  // Sample sites point their Facebook button at BohdiAI's own page (Alex, 2026-10-05).
  facebookUrl: 'https://www.facebook.com/Bohdiai/',
  instagramUrl: '',
};

/** In site order. */
export const PHOTOS: CardSiteModule['PHOTOS'] = [
  { file: 'e01.jpg', caption: 'Where it starts' },
  { file: 'e02.jpg', caption: 'Shou sugi ban' },
  { file: 'e03.jpg', caption: 'Goldie, on basswood' },
  { file: 'e04.jpg', caption: 'The Carters' },
  { file: 'e05.jpg', caption: 'Charred pine table' },
  { file: 'e06.jpg', caption: 'White Mountains' },
  { file: 'e07.jpg', caption: 'Wedding wreath' },
  { file: 'e08.jpg', caption: 'Cedar herb box' },
  { file: 'e09.jpg', caption: 'Compass rose' },
  { file: 'e10.jpg', caption: 'Botanical coasters' },
];

/** Made-up market dates for the sample (scripts add them; the owner manages them after). */
export const DATES = [
  { date: '2026-10-31', name: 'Harvest Market', town: 'Newport' },
  { date: '2026-11-21', name: 'Island Makers Fair', town: 'Middletown' },
  { date: '2026-12-12', name: 'Winter Night Market', town: 'Bristol' },
];
