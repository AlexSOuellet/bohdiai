import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EMPTY_MOMENT } from '@/lib/backend/moment/moment-form';
import { EMPTY_SECTION, SECTION_KEYS, type SiteSections } from '@/lib/backend/sections/sections-form';
import { EMPTY_PROFILE } from '@/lib/backend/profile/profile-form';
import type { MarketDate } from '@/lib/backend/dates/dates-form';

const loaders = vi.hoisted(() => ({
  features: new Set<string>(),
  testimonials: vi.fn(),
  dates: vi.fn(),
}));
vi.mock('@/lib/backend/features', () => ({ loadSiteFeatures: async () => loaders.features }));
vi.mock('@/lib/backend/moment/queries', () => ({ getMoment: async () => ({ ...EMPTY_MOMENT, headline: 'Poured by hand', media: null, photos: [] }) }));
vi.mock('@/lib/backend/sections/queries', () => ({ getSiteSections: async () => sections({ work: { title: 'Fresh off the shelf' } }) }));
vi.mock('@/lib/backend/profile/queries', () => ({ getProfileForm: async () => EMPTY_PROFILE, getPortraitUrl: async () => null }));
vi.mock('@/lib/backend/testimonials/queries', () => ({ listTestimonials: loaders.testimonials }));
vi.mock('@/lib/backend/dates/queries', () => ({ listMarketDates: loaders.dates }));

import { familyMarketDay, familyViewFromHomes, holdsLegacyContent, loadFamilyHomes, type FamilyHomes } from './from-homes';

function sections(over: Partial<Record<keyof SiteSections, Partial<typeof EMPTY_SECTION>>> = {}): SiteSections {
  return Object.fromEntries(SECTION_KEYS.map((k) => [k, { ...EMPTY_SECTION, ...(over[k] ?? {}) }])) as SiteSections;
}

const market = (over: Partial<MarketDate> = {}): MarketDate => ({
  id: 'd1', date: '2026-10-17', endDate: '', name: 'Wickford Art Festival', town: 'Wickford', hours: '9am–4pm', address: '', booth: '', url: '', canceled: false, ...over,
});

const empty: FamilyHomes = {
  name: 'Ember Candle Co',
  sellsOnline: false,
  moment: { ...EMPTY_MOMENT, media: null, photos: [] },
  sections: sections(),
  profile: EMPTY_PROFILE,
  portraitUrl: null,
  testimonials: [],
  dates: [],
};

describe('familyViewFromHomes', () => {
  it('puts every piece in its section', () => {
    const v = familyViewFromHomes({
      ...empty,
      sellsOnline: true,
      moment: {
        ...EMPTY_MOMENT, kicker: 'Small batch', headline: 'Poured by hand', sub: 'Soy candles', story: ['The wick', 'The wax'],
        ctaLabel: 'Shop', ctaTarget: 'shop', secondCtaLabel: 'Our story', secondCtaTarget: 'about', playMode: 'always',
        media: { kind: 'video', url: 'https://cdn/m.mp4', alt: 'A flame', posterUrl: 'https://cdn/p.webp' },
        photos: [{ id: 'p1', url: 'https://cdn/1.webp', alt: 'One' }],
      },
      sections: sections({
        work: { kicker: 'The shelf', title: 'Fresh off the shelf', moreLabel: 'See all' },
        collections: { title: 'Browse by scent' },
        about: { kicker: 'Meet the maker', title: 'Hi, I’m June', moreLabel: 'Read my story', pageTitle: 'How it started' },
        reviews: { title: 'Kind words', moreLabel: 'All of them' },
        markets: { title: 'Find me at', pageTitle: 'Where I’ll be', moreLabel: 'All dates' },
        close: { kicker: 'Come by', title: 'Light one tonight', moreLabel: 'Shop candles', moreTarget: 'shop' },
        contact: { title: 'Say hello', lede: 'Write any time.' },
      }),
      profile: { ...EMPTY_PROFILE, bio: 'It started in a kitchen.\n\nNow it’s a shop.', quote: 'Every candle is a small fire.', quoteAttribution: 'June', marqueePhrases: ['Small batch', 'Soy wax'] },
      portraitUrl: 'https://cdn/me.webp',
      testimonials: [{ id: 't1', quote: 'Smells like home', name: 'Ann', detail: 'Providence' }, { id: 't2', quote: 'Lovely', name: 'Bo', detail: '' }],
      dates: [market()],
    });
    expect(v.shopName).toBe('Ember Candle Co');
    expect(v.identity).toEqual({ wordmark: 'Ember Candle Co', sellsOnline: true });
    expect(v.moment).toEqual({
      media: { kind: 'video', url: 'https://cdn/m.mp4', poster: 'https://cdn/p.webp', alt: 'A flame' },
      story: ['The wick', 'The wax'], eyebrow: 'Small batch', brand: 'Poured by hand', sub: 'Soy candles', playMode: 'always',
      collageShots: [{ url: 'https://cdn/1.webp', alt: 'One' }],
      ctaLabel: 'Shop', ctaTarget: 'shop', secondaryCtaLabel: 'Our story', secondaryCtaTarget: 'about',
    });
    expect(v.goods).toEqual({ title: 'Fresh off the shelf', label: 'The shelf', viewAllLabel: 'See all' });
    expect(v.collections).toMatchObject({ title: 'Browse by scent' });
    expect(v.reviews).toEqual({
      title: 'Kind words', label: undefined, viewAllLabel: 'All of them',
      items: [{ quote: 'Smells like home', author: 'Ann', location: 'Providence' }, { quote: 'Lovely', author: 'Bo', location: undefined }],
    });
    expect(v.marquee).toEqual({ voice: ['Small batch', 'Soy wax'] });
    expect(v.founder).toEqual({
      quote: 'Every candle is a small fire.', attribution: 'June', eyebrow: 'Meet the maker', heading: 'Hi, I’m June',
      photo: { url: 'https://cdn/me.webp', alt: '' }, aboutLabel: 'Read my story',
      findUs: { label: 'Find me at', title: 'Where I’ll be', eventsLabel: 'All dates', rows: [{ day: 'Sat Oct 17', where: 'Wickford Art Festival, Wickford', time: '9am–4pm', date: '2026-10-17' }] },
    });
    expect(v.close).toEqual({ label: 'Come by', headline: 'Light one tonight', ctaLabel: 'Shop candles', ctaTarget: 'shop' });
    expect(v.about).toEqual({ heading: 'How it started', story: ['It started in a kitchen.', 'Now it’s a shop.'] });
    expect(v.contact).toEqual({ heading: 'Say hello', intro: 'Write any time.' });
  });

  it('leaves what the site hasn’t filled empty, inventing nothing', () => {
    const v = familyViewFromHomes(empty);
    expect(v.moment.media).toEqual({ kind: 'still', alt: '' });
    expect(v.moment).toMatchObject({ story: [], eyebrow: '', brand: '', sub: undefined, collageShots: undefined, ctaLabel: '', ctaTarget: undefined });
    expect(v.goods).toEqual({ title: '', label: undefined, viewAllLabel: undefined });
    expect(v.reviews).toBeUndefined();
    expect(v.marquee).toBeUndefined();
    expect(v.founder.findUs).toBeUndefined();
    expect(v.founder.photo).toEqual({ url: undefined, alt: '' });
    expect(v.close).toEqual({ label: '', headline: '', ctaLabel: '', ctaTarget: undefined });
    expect(v.about).toBeUndefined();
    expect(v.contact).toBeUndefined();
  });

  it('reads a photo moment as a still, without a poster', () => {
    const v = familyViewFromHomes({ ...empty, moment: { ...empty.moment, media: { kind: 'image', url: 'https://cdn/a.webp', alt: 'Candles', posterUrl: '' } } });
    expect(v.moment.media).toEqual({ kind: 'still', url: 'https://cdn/a.webp', alt: 'Candles' });
  });

  it('marks a canceled market and writes a market with no town by its name', () => {
    const v = familyViewFromHomes({ ...empty, dates: [market({ canceled: true, town: '' })] });
    expect(v.founder.findUs?.rows[0]?.where).toBe('Wickford Art Festival (Canceled)');
  });

  it('keeps a contact section with only an intro', () => {
    expect(familyViewFromHomes({ ...empty, sections: sections({ contact: { lede: 'Write any time.' } }) }).contact).toEqual({ heading: '', intro: 'Write any time.' });
  });
});

describe('familyMarketDay', () => {
  it('writes one day, or a range', () => {
    expect(familyMarketDay({ date: '2026-10-17', endDate: '' })).toBe('Sat Oct 17');
    expect(familyMarketDay({ date: '2026-11-21', endDate: '2026-11-22' })).toBe('Sat Nov 21 – Sun Nov 22');
  });
});

describe('holdsLegacyContent', () => {
  it('spots the old samples’ content and nothing else', () => {
    expect(holdsLegacyContent({ moment: {}, goods: {} })).toBe(true);
    expect(holdsLegacyContent({ design: 'cozy' })).toBe(false);
    expect(holdsLegacyContent({})).toBe(false);
    expect(holdsLegacyContent(null)).toBe(false);
    expect(holdsLegacyContent('moment')).toBe(false);
  });
});

describe('loadFamilyHomes', () => {
  type Tenant = { data: { business_name: string } | null; error: { message: string } | null };
  const db = (tenant: Tenant) =>
    ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => tenant }) }) }) }) as unknown as Parameters<typeof loadFamilyHomes>[0];

  beforeEach(() => {
    loaders.features = new Set();
    loaders.testimonials.mockReset().mockResolvedValue([{ id: 't1', quote: 'Lovely', name: 'Ann', detail: '' }]);
    loaders.dates.mockReset().mockResolvedValue([market()]);
  });

  it('reads every home, leaving switched-off testimonials and dates out', async () => {
    const h = await loadFamilyHomes(db({ data: { business_name: 'Ember' }, error: null }), 't1');
    expect(h).toMatchObject({ name: 'Ember', sellsOnline: false, testimonials: [], dates: [], portraitUrl: null });
    expect(h.moment.headline).toBe('Poured by hand');
    expect(h.sections.work.title).toBe('Fresh off the shelf');
    expect(loaders.testimonials).not.toHaveBeenCalled();
    expect(loaders.dates).not.toHaveBeenCalled();
  });

  it('reads testimonials, dates and the cart when they’re switched on', async () => {
    loaders.features = new Set(['testimonials', 'market_dates', 'cart']);
    const h = await loadFamilyHomes(db({ data: { business_name: 'Ember' }, error: null }), 't1');
    expect(h.sellsOnline).toBe(true);
    expect(h.testimonials).toHaveLength(1);
    expect(h.dates).toHaveLength(1);
  });

  it('throws a plain error when the site can’t be read or doesn’t exist', async () => {
    await expect(loadFamilyHomes(db({ data: null, error: { message: 'down' } }), 't1')).rejects.toThrow('Could not load the site: down');
    await expect(loadFamilyHomes(db({ data: null, error: null }), 't1')).rejects.toThrow('Could not load the site: no such tenant');
  });
});
