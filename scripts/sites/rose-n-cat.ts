/**
 * Rose n' Cat Reborn Babies — Renee Mazzone's reborn dolls (Smithfield, RI), a
 * sample to show her (boutique archetype, nursery design). Photos are her own,
 * from her Facebook page (tmp/samples/rose-n-cat/web). Every baby is ready-made
 * (no made to order), one of a kind, $120 — the starting price Alex gave.
 * The babies' names are placeholders for Renee to rename in the backend.
 * Built by scripts/build-boutique-site.ts.
 */
import type { ProfileForm } from '../../lib/backend/profile/profile-form';
import type { BoutiqueSiteModule } from '../build-boutique-site';

export const SITE: BoutiqueSiteModule['SITE'] = {
  subdomain: 'rose-n-cat',
  businessName: 'Rose n’ Cat Reborn Babies',
  design: 'nursery',
  logo: 'logo.png',
};

export const PROFILE: ProfileForm = {
  kicker: 'Reborn artist · Smithfield, Rhode Island',
  headline: 'One-of-a-kind reborn babies, painted by hand and ready to come home',
  aboutTitle: 'Every baby is one of a kind',
  bio: [
    'I’m Renee, an emerging reborn artist in Smithfield, Rhode Island.',
    'Every baby in my nursery is painted by hand, layer by layer, with hair and lashes rooted by hand, and made to be a collectable heirloom. No two are alike.',
    'Each one here is finished and ready to go home. If someone catches your eye, ask me anything about them.',
  ].join('\n\n'),
  signature: 'Renee',
  makes: ['Reborn babies', 'Painted by hand', 'One of a kind'],
  phone: '(401) 559-2512',
  facebookUrl: 'https://www.facebook.com/profile.php?id=100066239151222',
  instagramUrl: '',
};

/** Babies who have already gone home — her own past work, from her Facebook page. */
export const GALLERY: BoutiqueSiteModule['GALLERY'] = [
  { file: 'g01-christmas-twins.webp', caption: 'Christmas twins' },
  { file: 'g02-elf-hat.webp', caption: 'Little elf' },
  { file: 'g03-owl-hat.webp', caption: 'Owl hat and plaid' },
  { file: 'g04-rainbow-hat.webp', caption: 'Rainbow hat' },
  { file: 'g05-purple-bow.webp', caption: 'Purple tutu' },
  { file: 'g06-yellow-hood.webp', caption: 'Sunny yellow hoodie' },
  { file: 'g07-flower-crown.webp', caption: 'Flower crown' },
  { file: 'g08-red-bow.webp', caption: 'Red bow' },
  { file: 'g09-green-wrap.webp', caption: 'Green headwrap' },
  { file: 'g10-plaid.webp', caption: 'Plaid dress' },
  { file: 'g11-brown-bow.webp', caption: 'Big brown bow' },
  { file: 'g12-first-christmas.webp', caption: 'First Christmas' },
];

/** Where to find her. The Scituate Art Festival is real (this weekend, Alex);
 *  the rest are made-up sample dates modeled on the fairs she did last fall. */
export const DATES: BoutiqueSiteModule['DATES'] = [
  { date: '2026-10-10', name: 'Scituate Art Festival', town: 'Scituate' },
  { date: '2026-10-17', name: 'Bazaar & Vendor Fair', town: 'Pascoag' },
  { date: '2026-10-24', name: 'Pumpkin Fest at Bridgeway', town: 'Pascoag' },
  { date: '2026-11-21', name: 'Holly Fair', town: 'Johnston' },
  { date: '2026-12-12', name: 'Holiday Fair', town: 'Smithfield' },
];

const READY = 'Finished, one of a kind, and ready to go home.';

/** In nursery order; the first five are the home page's picks. */
export const BABIES: BoutiqueSiteModule['BABIES'] = [
  {
    name: 'Theo',
    short: 'Sleeping boy in a knit bunny hat',
    description: `A sleepy newborn boy in his knit bunny hat and “Mommy’s Little Star” top.\n\n${READY}`,
    photos: ['02-star-boy.webp', '01-hero.webp', '02b-star-boy.webp'],
    onHome: true,
  },
  {
    name: 'Rosie',
    short: 'Sleeping girl with a floral bow',
    description: `A sleeping newborn girl in a floral bow and gold-trimmed top.\n\n${READY}`,
    photos: ['03-floral-bow.webp'],
    onHome: true,
  },
  {
    name: 'Ruby',
    short: 'Sleeping girl in a red lace bonnet',
    description: `A sleeping girl in a red lace bonnet and dress.\n\n${READY}`,
    photos: ['12-red-bonnet.webp', '12b-red-bonnet.webp'],
    onHome: true,
  },
  {
    name: 'Ava',
    short: 'Awake girl with dark hair',
    description: `An awake baby girl with soft dark hair and a sweet blue outfit.\n\n${READY}`,
    photos: ['04-blue.webp'],
    onHome: true,
  },
  {
    name: 'Holly',
    short: 'Sleeping girl with a plaid bow',
    description: `A sleeping girl in a red plaid bow and soft black fur.\n\n${READY}`,
    photos: ['13-buffalo.webp', '13b-buffalo.webp'],
    onHome: true,
  },
  {
    name: 'Oliver',
    short: 'Awake boy in little glasses',
    description: `An awake baby in tiny round glasses and a burgundy romper.\n\n${READY}`,
    photos: ['05-glasses.webp'],
  },
  {
    name: 'Poppy',
    short: 'Sleeping girl in a strawberry dress',
    description: `A sleeping girl in a strawberry dress and a big red bow.\n\n${READY}`,
    photos: ['06-strawberry.webp'],
  },
  {
    name: 'Mateo',
    short: 'Awake boy with rooted dark hair',
    description: `An awake baby boy with rooted dark hair, in black and stripes.\n\n${READY}`,
    photos: ['07-dark-hair.webp'],
  },
  {
    name: 'June',
    short: 'Sleeping girl in a pink knit hood',
    description: `A sleeping girl with dark curls in a pink knit hooded romper.\n\n${READY}`,
    photos: ['08-pink-knit.webp'],
  },
  {
    name: 'Nora',
    short: 'Awake girl in a floral headwrap',
    description: `An awake baby girl in a floral headwrap and gown.\n\n${READY}`,
    photos: ['09-headwrap.webp'],
  },
  {
    name: 'Bella',
    short: 'Sleeping girl in rose ruffles',
    description: `A sleeping girl in a white flower band and rose ruffles.\n\n${READY}`,
    photos: ['10-ruffles.webp'],
  },
  {
    name: 'Daisy',
    short: 'Sleeping girl in a tulle dress',
    description: `A sleeping girl in a dotted tulle dress and a pale bow.\n\n${READY}`,
    photos: ['11-tutu.webp'],
  },
  {
    name: 'Hazel',
    short: 'Sleeping girl in a bunny bonnet',
    description: `A sleeping girl in a lace bunny-ear bonnet.\n\n${READY}`,
    photos: ['14-bunny.webp'],
  },
  {
    name: 'Finn',
    short: 'Sleeping boy in blue overalls',
    description: `A sleeping boy in a blue cap and overalls.\n\n${READY}`,
    photos: ['15-overalls.webp'],
  },
  {
    name: 'Winnie',
    short: 'Sleeping girl in a snowman onesie',
    description: `A sleeping girl in a snowman onesie and pink hat.\n\n${READY}`,
    photos: ['16-snowman.webp'],
  },
];
