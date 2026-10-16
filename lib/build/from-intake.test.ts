import { describe, it, expect } from 'vitest';
import { SECTION_KEYS } from '@/lib/backend/sections/sections-form';
import { checkDrafts, draftsSchema, siteFromIntake, type IntakeDrafts, type IntakeForBuild } from './from-intake';
import { designWordKeys, planSite } from './site-plan';

const words = Object.fromEntries(designWordKeys('family').map((k) => [k, `word for ${k}`]));
const settings = { subdomain: 'tide-and-twine', family: 'cozy' as const, skin: 'main-street-ember' };

function intake(over: Partial<IntakeForBuild> = {}): IntakeForBuild {
  return {
    plan: 'lite',
    makerName: 'Lena',
    businessName: 'Tide & Twine',
    email: 'lena@example.com',
    makes: 'Knotted rope baskets',
    about: 'I started knotting rope on the porch. Every basket takes a weekend.',
    portraitFile: 'portrait.webp',
    pieces: [
      { name: 'Harbor basket', priceCents: 4500, description: 'A deep one.', file: 'piece-1.webp' },
      { name: 'Little tote', priceCents: null, description: null, file: 'piece-2.webp' },
      { name: 'Bowl', priceCents: 2000, description: 'Shallow.', file: 'piece-3.webp' },
      { name: 'Hamper', priceCents: 9000, description: 'Tall.', file: 'piece-4.webp' },
      { name: 'Coaster set', priceCents: 1500, description: 'Four.', file: 'piece-5.webp' },
    ],
    ...over,
  };
}

const sec = { kicker: '', title: 'A heading', lede: '', moreLabel: 'More', pageTitle: '' };
function drafts(over: Partial<IntakeDrafts> = {}): IntakeDrafts {
  return {
    profile: { kicker: 'On the porch', headline: 'Rope, knotted by hand', aboutTitle: 'About Lena', makes: ['Baskets', 'Totes'], quote: 'Every basket takes a weekend.', marqueePhrases: ['knotted by hand', 'one weekend each', 'rope and patience', 'made on the porch'] },
    moment: { kicker: 'Knotted by hand', sub: 'Baskets that take a weekend', story: ['A coil of rope', 'A weekend of knots', 'A basket'], ctaLabel: 'See the baskets', ctaTarget: 'shop', secondCtaLabel: 'Meet Lena', secondCtaTarget: 'about' },
    sections: Object.fromEntries(SECTION_KEYS.map((k) => [k, sec])) as IntakeDrafts['sections'],
    closeTarget: 'shop',
    collections: [
      { name: 'Baskets', description: 'For carrying', pieces: [1, 2, 4] },
      { name: 'Table', description: 'For the table', pieces: [3, 5] },
      { name: 'Empty', description: '', pieces: [] },
    ],
    pieceDescriptions: [{ piece: 2, description: 'A small tote with rope handles.' }],
    homePieces: [1, 3, 4],
    openingPiece: 4,
    ...over,
  };
}

describe('siteFromIntake', () => {
  it('builds a content file the one builder takes as it is', () => {
    const file = siteFromIntake(intake(), drafts(), settings, words);
    const planned = planSite(file);
    expect(planned.ok ? [] : planned.errors).toEqual([]);
  });

  it('keeps the maker’s own words as they wrote them', () => {
    const file = siteFromIntake(intake(), drafts(), settings, words);
    expect(file.site).toMatchObject({ businessName: 'Tide & Twine', plan: 'lite', family: 'cozy', contactEmail: 'lena@example.com' });
    expect(file.profile.bio).toBe(intake().about);
    expect(file.profile).toMatchObject({ signature: 'Lena', quote: 'Every basket takes a weekend.', quoteAttribution: 'Lena' });
    expect(file.moment?.headline).toBe('Tide & Twine');
    expect(file.products?.[0]).toMatchObject({ name: 'Harbor basket', priceCents: 4500, description: 'A deep one.', onHome: true, collections: ['baskets'] });
    expect(file.portrait).toEqual({ file: 'portrait.webp', alt: 'Lena' });
  });

  it('fills a blank description from the drafts, opens on the chosen photo, and drops empty groups', () => {
    const file = siteFromIntake(intake(), drafts(), settings, words);
    expect(file.products?.[1]).toMatchObject({ priceCents: null, description: 'A small tote with rope handles.', onHome: false });
    expect(file.moment?.media).toEqual({ file: 'piece-4.webp', alt: 'Hamper', kind: 'image' });
    expect(file.collections?.map((c) => c.slug)).toEqual(['baskets', 'table']);
    expect(file.sections?.close?.moreTarget).toBe('shop');
    expect(file.sections?.work?.moreTarget).toBe('');
  });

  it('Showcase has no shop: the pieces become the gallery, with no prices and no groups', () => {
    const file = siteFromIntake(intake({ plan: 'showcase' }), drafts({ moment: { ...drafts().moment, ctaTarget: 'about', secondCtaTarget: 'contact' }, closeTarget: 'contact' }), settings, words);
    expect(file.products).toBeUndefined();
    expect(file.collections).toBeUndefined();
    expect(file.gallery).toEqual(intake().pieces.map((p) => ({ file: p.file, caption: p.name })));
    expect(planSite(file).ok).toBe(true);
  });

  it('no portrait, no quote and no niche leave them out', () => {
    const file = siteFromIntake(intake({ portraitFile: null }), drafts({ profile: { ...drafts().profile, quote: ' ' } }), { ...settings, niche: 'baskets' }, words);
    expect(file.portrait).toBeUndefined();
    expect(file.profile).toMatchObject({ quote: '', quoteAttribution: '' });
    expect(file.site.niche).toBe('baskets');
    const noOpening = siteFromIntake(intake(), drafts({ openingPiece: 99 }), settings, words);
    expect(noOpening.moment?.media).toBeUndefined();
  });
});

describe('checkDrafts', () => {
  it('right drafts have nothing wrong', () => {
    expect(checkDrafts(intake(), drafts())).toEqual([]);
  });

  it('names pieces that aren’t there, missing and extra descriptions, and a quote that isn’t theirs', () => {
    const errs = checkDrafts(
      intake(),
      drafts({
        openingPiece: 0,
        homePieces: [6],
        collections: [{ name: 'Baskets', description: '', pieces: [9] }],
        pieceDescriptions: [{ piece: 1, description: 'x' }],
        profile: { ...drafts().profile, quote: 'A sentence they never wrote.' },
      }),
    );
    expect(errs).toEqual([
      "openingPiece 0 isn't a piece (1 to 5)",
      "homePieces: 6 isn't a piece (1 to 5)",
      'collections: "Baskets" names 9, which isn\'t a piece',
      'pieceDescriptions: piece 2 was left blank and needs one',
      "pieceDescriptions: piece 1 has the maker's own description; leave it",
      'profile.quote must be a sentence copied word for word from their about',
    ]);
    expect(checkDrafts(intake(), drafts({ homePieces: [] }))).toContain('homePieces: pick the pieces for the home page');
  });
});

describe('draftsSchema', () => {
  it('only offers the pages the plan has', () => {
    expect(draftsSchema('showcase').safeParse({ ...drafts(), closeTarget: 'shop' }).success).toBe(false);
    expect(draftsSchema('lite').safeParse(drafts()).success).toBe(true);
  });
});
