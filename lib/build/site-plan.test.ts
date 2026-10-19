import { describe, it, expect } from 'vitest';
import { EMPTY_PROFILE } from '@/lib/backend/profile/profile-form';
import { EMPTY_MOMENT } from '@/lib/backend/moment/moment-form';
import { SECTION_KEYS } from '@/lib/backend/sections/sections-form';
import { designWordKeys, planSite, slugOf, type BuildDesign, type SiteFile } from './site-plan';

/** Every spot the design shows, each with a word. */
function allWords(design: BuildDesign): Record<string, string> {
  return Object.fromEntries(designWordKeys(design).map((k) => [k, `word for ${k}`]));
}

/** Changes to a test site; a key set to undefined leaves that part out. */
type Over = { [K in keyof SiteFile]?: SiteFile[K] | undefined };

function familySite(over: Over = {}): SiteFile {
  return {
    site: { subdomain: 'flag-and-field', businessName: 'Flag & Field', design: 'family', family: 'cozy', skin: 'main-street-ember', plan: 'full', contactEmail: ' alex@example.com ', niche: 'jewelry_maker' },
    profile: { ...EMPTY_PROFILE, headline: 'Flags sewn by hand', bio: 'I sew flags.' },
    portrait: { file: 'portrait.webp', alt: 'At the machine' },
    moment: { ...EMPTY_MOMENT, headline: 'Flag & Field', story: ['stitched by hand'], media: { file: 'open.webp', alt: 'A flag in the wind', kind: 'image' }, photos: [{ file: 'p1.webp', alt: 'one' }] },
    sections: { work: { title: 'The flags' } },
    gallery: [{ file: 'g1.webp', caption: ' Porch flag ' }, { file: 'g2.webp', caption: '' }],
    collections: [{ slug: 'garden', name: 'Garden flags', description: '' }],
    products: [
      { name: 'Tide flag', priceCents: 4800, description: ' A flag. ', photos: [{ file: 'tide.webp', alt: '' }, { file: 'p1.webp', alt: 'shared photo' }], collections: ['garden'], onHome: true },
      { name: 'Custom flag', slug: 'custom', priceCents: null, description: 'Ask me.', short: ' One of a kind ', stock: 3, isNew: true, photos: [] },
    ],
    markets: [{ date: '2026-11-07', endDate: '', name: 'Harvest Fair', town: 'Wickford', hours: '9–4', booth: '' }],
    testimonials: [{ quote: 'Beautiful work.', name: 'Pat' }],
    words: allWords('family'),
    ...over,
  } as SiteFile;
}

function cardSite(over: Over = {}): SiteFile {
  return {
    site: { subdomain: 'saltwater', businessName: 'Saltwater', design: 'shoreline', family: 'rustic', skin: 'main-street-sawdust', plan: 'showcase' },
    profile: { ...EMPTY_PROFILE, headline: 'Painted shells' },
    words: allWords('shoreline'),
    ...over,
  } as SiteFile;
}

function errorsOf(f: SiteFile): string[] {
  const r = planSite(f);
  return r.ok ? [] : r.errors;
}

describe('planSite — a family site', () => {
  it('lays out every home from a right content file', () => {
    const r = planSite(familySite());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const p = r.plan;
    expect(p.contactEmail).toBe('alex@example.com');
    expect(p.niche).toBe('jewelry_maker');
    expect(p.pageRoot).toEqual({ kind: 'archetype', archetypeKey: 'main-street', mood: 'cozy', lookKey: 'main-street-ember', accentOverride: null, content: {} });
    expect(p.features).toContainEqual({ key: 'moment', enabled: true });
    // Markets and Gallery are the plan's, never switched by the content.
    expect(p.features.map((f) => f.key)).not.toContain('gallery');
    expect(p.features.map((f) => f.key)).not.toContain('market_dates');
    expect(p.sections.map((s) => s.section)).toEqual([...SECTION_KEYS]);
    expect(p.sections.find((s) => s.section === 'work')?.row.title).toBe('The flags');
    expect(p.moment?.photos).toHaveLength(1);
    expect(p.gallery[0]?.caption).toBe('Porch flag');
    expect(p.gallery[1]?.caption).toBeNull();
    expect(p.collections[0]).toEqual({ slug: 'garden', name: 'Garden flags', description: null });
    expect(p.products[0]).toMatchObject({ slug: 'tide-flag', description: 'A flag.', short: null, stock: 1, onHome: true, isNew: false, collections: ['garden'] });
    expect(p.products[1]).toMatchObject({ slug: 'custom', priceCents: null, short: 'One of a kind', stock: 3, isNew: true, collections: [] });
    expect(p.markets[0]).toMatchObject({ name: 'Harvest Fair', hours: '9–4', booth: null, address: null, url: null });
    expect(p.testimonials[0]).toMatchObject({ quote: 'Beautiful work.', name: 'Pat' });
    expect(p.words).toHaveLength(designWordKeys('family').length);
    // Each photo uploads once, even when two spots share it.
    expect(p.files).toEqual(['portrait.webp', 'open.webp', 'p1.webp', 'g1.webp', 'g2.webp', 'tide.webp']);
  });

  it('a site with nothing optional still plans, with those switches off', () => {
    const r = planSite(familySite({ portrait: undefined, gallery: undefined, collections: undefined, products: undefined, markets: undefined, testimonials: undefined, sections: undefined, moment: { ...EMPTY_MOMENT } }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.plan.portrait).toBeNull();
    expect(r.plan.moment?.media).toBeNull();
    expect(r.plan.moment?.poster).toBeNull();
    expect(r.plan.features.map((f) => f.key)).not.toContain('gallery');
    expect(r.plan.features.map((f) => f.key)).not.toContain('market_dates');
    expect(r.plan.files).toEqual([]);
    expect(r.plan.contactEmail).toBe('alex@example.com');
  });

  it('needs its opening', () => {
    expect(errorsOf(familySite({ moment: undefined }))).toContain('moment: a family site needs its opening');
  });

  it('checks the opening: its words, its photos and its media', () => {
    const tooMany = [1, 2, 3, 4].map((n) => ({ file: `x${n}.webp`, alt: '' }));
    const errs = errorsOf(familySite({ moment: { ...EMPTY_MOMENT, headline: 'x'.repeat(500), photos: tooMany, media: { file: 'clip.webp', alt: '', kind: 'video' } } }));
    expect(errs.some((e) => e.startsWith('moment: ') && e.includes('3 extra photos'))).toBe(true);
    expect(errs).toContain('moment: "clip.webp" isn\'t a video');
    expect(errs.filter((e) => e.startsWith('moment:')).length).toBeGreaterThanOrEqual(3);
    expect(errorsOf(familySite({ moment: { ...EMPTY_MOMENT, media: { file: 'open.mp4', alt: '', kind: 'image' } } }))).toContain('moment: "open.mp4" isn\'t a photo');
    const video = planSite(familySite({ moment: { ...EMPTY_MOMENT, media: { file: 'open.mp4', alt: '', kind: 'video' }, poster: { file: 'poster.webp', alt: '' } } }));
    expect(video.ok && video.plan.files).toContain('poster.webp');
  });

  it('a button may only point at a page the plan has', () => {
    const showcase = (over: Over = {}): SiteFile => {
      const base = familySite(over);
      return { ...base, site: { ...base.site, plan: 'showcase' } };
    };
    const toShop = { ...EMPTY_MOMENT, headline: 'Flag & Field', ctaLabel: 'See the flags', ctaTarget: 'shop' as const, secondCtaLabel: 'Groups', secondCtaTarget: 'collections' as const };
    const errs = errorsOf(showcase({ moment: toShop, sections: { about: { moreLabel: 'Shop', moreTarget: 'shop' }, makes: { moreLabel: 'About', moreTarget: 'about' } } }));
    expect(errs).toEqual([
      `moment: the main button points at "shop", a page the showcase plan doesn't have`,
      `moment: the second button points at "collections", a page the showcase plan doesn't have`,
      `sections.about: the link at the bottom points at "shop", a page the showcase plan doesn't have`,
    ]);
    expect(errorsOf(showcase({ moment: { ...toShop, ctaTarget: 'about', secondCtaLabel: '', secondCtaTarget: '' } }))).toEqual([]);
    // Market and Full have the shop.
    expect(errorsOf(familySite({ moment: toShop }))).toEqual([]);
  });

  it('checks the section words', () => {
    expect(errorsOf(familySite({ sections: { work: { title: 'x'.repeat(500) } } })).some((e) => e.startsWith('sections.work: '))).toBe(true);
    expect(errorsOf(familySite({ sections: { nope: {} } as SiteFile['sections'] }))).toContain('sections: unknown section "nope"');
  });
});

describe('planSite — the shoreline and show reel pages', () => {
  it('plans a card page with its design in the page record and no opening of its own', () => {
    const r = planSite(cardSite());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.plan.pageRoot).toMatchObject({ archetypeKey: 'card', mood: 'rustic', lookKey: 'main-street-sawdust', content: { design: 'shoreline' } });
    expect(r.plan.moment).toBeNull();
    expect(r.plan.sections).toEqual([]);
    expect(r.plan.features).toContainEqual({ key: 'moment', enabled: false });
    expect(r.plan.contactEmail).toBeNull();
    expect(r.plan.niche).toBeNull();
  });

  it('refuses an opening or section words on a card page', () => {
    const errs = errorsOf(cardSite({ moment: { ...EMPTY_MOMENT }, sections: {} }));
    expect(errs).toContain('moment: the shoreline design has no opening of its own (its top line is in About you)');
    expect(errs).toContain('sections: the shoreline design reads its headings from its words');
  });
});

describe('planSite — the photo behind a Scenic site', () => {
  const scenic = (over: Over = {}): SiteFile => familySite({ site: { ...familySite().site, family: 'scenic', skin: 'main-street-saltmarsh' }, ...over });

  it('plans a library scene', () => {
    const r = planSite(scenic({ scene: { library: 'marsh' } }));
    expect(r.ok ? r.plan.scene : r.errors).toEqual({ library: 'marsh' });
  });

  it('plans the maker’s own photo, uploaded with the rest', () => {
    const r = planSite(scenic({ scene: { photo: { file: 'bay.webp', alt: 'The bay' } } }));
    expect(r.ok ? r.plan.scene : r.errors).toEqual({ photo: { file: 'bay.webp', alt: 'The bay' } });
    expect(r.ok && r.plan.files.includes('bay.webp')).toBe(true);
  });

  it('plans a dark photo with a clip that loops over it, both uploaded', () => {
    const r = planSite(scenic({ scene: { photo: { file: 'still.webp', alt: '' }, tone: 'dark', video: { file: 'clip.mp4', alt: '' } } }));
    expect(r.ok ? r.plan.scene : r.errors).toEqual({ photo: { file: 'still.webp', alt: '' }, tone: 'dark', video: { file: 'clip.mp4', alt: '' } });
    expect(r.ok && r.plan.files.includes('clip.mp4') && r.plan.files.includes('still.webp')).toBe(true);
    expect(errorsOf(scenic({ scene: { photo: { file: 'still.webp', alt: '' }, video: { file: 'clip.webp', alt: '' } } }))).toContain(`scene: "clip.webp" isn't a video`);
  });

  it('a Scenic site needs one, and only from the library or a photo file', () => {
    expect(errorsOf(scenic())).toContain('scene: a Scenic site needs the photo behind its page (a library scene or its own photo)');
    expect(errorsOf(scenic({ scene: { library: 'Moon Rise' } }))).toContain(`scene: "Moon Rise" isn't a scene name`);
    expect(errorsOf(scenic({ scene: { photo: { file: 'bay.mp4', alt: '' } } }))).toContain(`scene: "bay.mp4" isn't a photo`);
  });

  it('any other family may have one (for wearing Scenic later), and needn’t', () => {
    const withScene = planSite(familySite({ scene: { library: 'marsh' } }));
    expect(withScene.ok ? withScene.plan.scene : withScene.errors).toEqual({ library: 'marsh' });
    const r = planSite(familySite());
    expect(r.ok ? r.plan.scene : r.errors).toBeNull();
  });
});

describe('planSite — what it refuses', () => {
  it('checks the site itself', () => {
    const errs = errorsOf(familySite({ site: { subdomain: 'Bad Name', businessName: ' ', design: 'nope' as BuildDesign, family: 'nope' as 'cozy', skin: 'x', plan: 'gold' as 'full', niche: 'Not A Slug' } }));
    expect(errs).toEqual(
      expect.arrayContaining([
        'site: "Bad Name" isn\'t a valid subdomain',
        'site: the business name is empty',
        'site: unknown design "nope"',
        'site: unknown family "nope"',
        'site: unknown plan "gold"',
        'site: "Not A Slug" isn\x27t a niche slug',
      ]),
    );
  });

  it('refuses BohdiAI’s own addresses, the marketing arms included', () => {
    for (const subdomain of ['makers', 'service', 'app', 'www']) {
      expect(errorsOf(familySite({ site: { ...familySite().site, subdomain } }))).toContain(`site: "${subdomain}" is one of BohdiAI's own addresses`);
    }
  });

  it('a skin has to be one of the family’s', () => {
    expect(errorsOf(familySite({ site: { ...familySite().site, skin: 'main-street-confetti' } }))).toContain('site: the skin "main-street-confetti" isn\'t one of the cozy family\'s skins');
    expect(errorsOf(familySite({ site: { ...familySite().site, skin: 'no-such-skin' } }))).toContain('site: the skin "no-such-skin" isn\'t one of the cozy family\'s skins');
  });

  it('checks About you', () => {
    expect(errorsOf(familySite({ profile: { ...EMPTY_PROFILE, headline: 'x'.repeat(500) } })).some((e) => e.startsWith('profile: '))).toBe(true);
  });

  it('checks the gallery', () => {
    const many = Array.from({ length: 13 }, (_, i) => ({ file: `g${i}.webp`, caption: '' }));
    expect(errorsOf(familySite({ gallery: many }))).toContain('gallery: at most 12 photos (got 13)');
    expect(errorsOf(familySite({ gallery: [{ file: 'g.webp', caption: 'x'.repeat(81) }] }))).toContain('gallery: caption over 80 characters: g.webp');
  });

  it('checks collections', () => {
    const errs = errorsOf(familySite({ collections: [{ slug: 'Bad Slug', name: 'A' }, { slug: 'twice', name: 'B' }, { slug: 'twice', name: ' ' }], products: [] }));
    expect(errs).toEqual(expect.arrayContaining(['collections: "Bad Slug" isn\'t a valid slug', 'collections: "twice" is listed twice', 'collections: "twice" has no name']));
  });

  it('checks the pieces', () => {
    const photos = Array.from({ length: 13 }, (_, i) => ({ file: `p${i}.webp`, alt: '' }));
    const errs = errorsOf(
      familySite({
        products: [
          { name: ' ', slug: 'blank', priceCents: 100, description: '', photos: [] },
          { name: 'Bad', slug: 'Bad Slug', priceCents: 100, description: '', photos: [] },
          { name: 'Twice', priceCents: 1.5, description: '', photos },
          { name: 'Twice', priceCents: -1, description: '', photos: [], collections: ['nowhere'] },
        ],
      }),
    );
    expect(errs).toEqual(
      expect.arrayContaining([
        'products: a piece has no name',
        'products: "Bad Slug" isn\'t a valid slug',
        'products: "twice" is listed twice',
        "products: twice's price isn't whole cents",
        'products: twice has more than 12 photos',
        'products: twice names a collection that isn\'t listed: "nowhere"',
      ]),
    );
  });

  it('checks markets and testimonials', () => {
    const markets = Array.from({ length: 21 }, (_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, endDate: '', name: `M${i}`, town: '' }));
    expect(errorsOf(familySite({ markets }))).toContain('markets: at most 20 (got 21)');
    expect(errorsOf(familySite({ markets: [{ date: 'soon', endDate: '', name: 'Fair', town: '' }] })).some((e) => e.startsWith('markets: soon Fair: '))).toBe(true);
    const testimonials = Array.from({ length: 31 }, (_, i) => ({ quote: 'Lovely', name: `N${i}` }));
    expect(errorsOf(familySite({ testimonials }))).toContain('testimonials: at most 30');
    expect(errorsOf(familySite({ testimonials: [{ quote: '', name: 'Pat' }] })).some((e) => e.startsWith('testimonials: Pat: '))).toBe(true);
  });

  it('needs every word the design shows, and only those', () => {
    const words = allWords('family');
    const [first] = designWordKeys('family');
    const few = Object.fromEntries(Object.entries(words).slice(0, 5));
    const missing = errorsOf(familySite({ words: few })).find((e) => e.startsWith('words: '));
    expect(missing).toMatch(/spot\(s\) have no word: .*, …$/);
    const blank = errorsOf(familySite({ words: { ...words, [first as string]: '' } }));
    expect(blank).toContain(`words: 1 spot(s) have no word: ${first}`);
    const extra = errorsOf(familySite({ words: { ...words, 'card.form.send': 'Send' } }));
    expect(extra).toContain('words: not spots of the family design: card.form.send');
    const lots = Object.fromEntries(Array.from({ length: 13 }, (_, i) => [`nope.${i}`, 'x']));
    expect(errorsOf(familySite({ words: { ...words, ...lots } })).find((e) => e.startsWith('words: not spots'))).toMatch(/, …$/);
  });
});

describe('slugOf', () => {
  it('makes a web-safe slug from a name', () => {
    expect(slugOf('Tide & Pine Candle')).toBe('tide-pine-candle');
    expect(slugOf('  Café—crème  ')).toBe('cafe-creme');
  });
});
