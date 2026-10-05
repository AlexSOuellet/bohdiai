/**
 * RusticRhody — Alex's own woodworking from about 2018 (burned-wood flags and
 * carved signs), the first business card site. Photos come from the RhodyStrong
 * Facebook page (Alex's own). The bio is Claude's draft for Alex to rewrite in
 * About you. Built by scripts/build-card-site.ts.
 */
import type { ProfileForm } from '../../lib/backend/profile/profile-form';
import type { CardSiteModule } from '../build-card-site';

export const SITE: CardSiteModule['SITE'] = {
  subdomain: 'rustic-rhody',
  businessName: 'Rustic Rhody',
  // The bulletin board design (its own look). Family and skin stay for the pinned prints design.
  design: 'bulletin',
  family: 'rustic',
  skin: 'main-street-sawdust',
};

export const PROFILE: ProfileForm = {
  kicker: 'Handmade in Rhode Island',
  headline: 'Burned-wood flags and carved signs, built board by board in a little Rhode Island shop',
  aboutTitle: 'Pine boards, a torch, and a steady hand',
  bio: [
    'Every flag starts as plain pine boards on my bench. I scorch them with a torch, stain every stripe by hand, and cut the stars one at a time.',
    'No two come out the same. The grain decides where the char goes deep and where the pine shows through, and that’s the part I love.',
    'Most of what I build is custom: a Marine emblem for a homecoming, a team logo for the den, a family name over the door. If it matters to you, tell me about it.',
  ].join('\n\n'),
  signature: 'Alex',
  makes: ['Burned-wood flags', 'Carved signs', 'Custom work'],
  phone: '',
  facebookUrl: 'https://www.facebook.com/RhodyStrong',
  instagramUrl: '',
};

/** In site order; the first opens the page. */
export const PHOTOS: CardSiteModule['PHOTOS'] = [
  { file: 'p30.jpg', caption: 'The shop wall' },
  { file: 'p66.jpg', caption: 'Army flag with the green line' },
  { file: 'p13.jpg', caption: 'POW / MIA' },
  { file: 'p40.jpg', caption: 'Layered Patriots logo' },
  { file: 'p14.jpg', caption: 'Dove of peace' },
  { file: 'p64.jpg', caption: 'Charred eagle with gold stars' },
  { file: 'p35.jpg', caption: 'A house divided' },
  { file: 'p3.jpg', caption: 'Marine Corps emblem' },
  { file: 'p37.jpg', caption: 'We the People' },
  { file: 'p26.jpg', caption: 'Marines, red and gold' },
  { file: 'p47.jpg', caption: 'Betsy Ross, charred' },
  { file: 'p31.jpg', caption: 'Retiree Wannabe' },
];
