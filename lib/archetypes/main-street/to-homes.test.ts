import { describe, it, expect } from 'vitest';
import { momentFormFromRow } from '@/lib/backend/moment/moment-form';
import { sectionsFromRows } from '@/lib/backend/sections/sections-form';
import { profileFormFromRow } from '@/lib/backend/profile/profile-form';
import { familyViewFromHomes } from './from-homes';
import { keyWords } from '@/lib/site-words/words';
import { FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX } from './words';
import { homesFromLegacy } from './to-homes';
import type { MainStreetView } from './schemas';

const legacy: MainStreetView = {
  shopName: 'Aurora Candles',
  identity: { wordmark: 'Aurora Candles' },
  moment: {
    media: { kind: 'video', url: 'https://cdn/hero/clip.mp4', poster: 'https://cdn/hero/poster.jpg', alt: 'A candle flickering' },
    story: ['Light that lingers', 'Poured in small batches'],
    eyebrow: 'Hand-poured in Rhode Island',
    brand: 'Aurora Candles',
    sub: 'Soy candles that burn clean and slow',
    playMode: 'once',
    collageShots: [{ url: 'https://cdn/c1.jpg', alt: 'Shelf' }, { alt: 'Not generated yet' }],
    ctaLabel: 'Shop the candles',
    ctaTarget: 'shop',
    secondaryCtaLabel: 'Our story',
    secondaryCtaTarget: 'about',
  },
  goods: { title: 'Fresh from the pour', label: 'The shelf', viewAllLabel: 'See every candle' },
  collections: { title: 'Shop by scent', label: 'Collections', viewAllLabel: 'All collections', items: [{ name: 'Woods', description: 'x', slug: 'woods' }] },
  reviews: {
    title: 'Kind words',
    summary: { score: '4.9 out of 5', count: '180+ happy customers' },
    items: [{ quote: 'My whole house smells like a cabin', author: 'Dana', location: 'Cranston' }, { quote: 'Burns for days', author: 'Lee' }],
  },
  marquee: { voice: ['Small batch', 'Clean burn', 'Made in RI'] },
  founder: {
    quote: 'Every candle starts with a memory.',
    attribution: 'June, founder of Aurora',
    eyebrow: 'Meet the maker',
    heading: 'Hi, I’m June',
    photo: { url: 'https://cdn/portrait.jpg', alt: 'June at the bench' },
    aboutLabel: 'Read my story',
    findUs: {
      label: 'Find us in person',
      title: 'Where we’ll be',
      eventsLabel: 'See all dates',
      rows: [
        { day: 'Sat Oct 17', where: 'Wickford Art Festival', time: '10–5', date: '2026-10-17' },
        { day: 'Saturdays', where: 'Downtown Makers Market', time: '9–3' },
      ],
    },
  },
  close: { label: 'Stay a while', headline: 'Light one tonight', ctaLabel: 'Shop now', ctaTarget: 'shop' },
  about: { heading: 'How Aurora began', story: ['It started in my kitchen.', 'Now it fills a barn.'] },
  contact: { heading: 'Say hello', intro: 'Questions about a scent? Write any time.' },
};

describe('homesFromLegacy', () => {
  const h = homesFromLegacy(legacy);

  it('sorts the moment into its home, with its media as addresses', () => {
    expect(h.moment).toMatchObject({ kicker: 'Hand-poured in Rhode Island', headline: 'Aurora Candles', story: ['Light that lingers', 'Poured in small batches'], cta_label: 'Shop the candles', cta_target: 'shop', second_cta_target: 'about', play_mode: 'once' });
    expect(h.momentMediaUrl).toBe('https://cdn/hero/clip.mp4');
    expect(h.momentPosterUrl).toBe('https://cdn/hero/poster.jpg');
    expect(h.momentPhotoUrls).toEqual([{ url: 'https://cdn/c1.jpg', alt: 'Shelf' }]);
  });

  it('sorts every section’s words into its own row', () => {
    expect(h.sections.work).toMatchObject({ kicker: 'The shelf', title: 'Fresh from the pour', more_label: 'See every candle' });
    expect(h.sections.about).toMatchObject({ kicker: 'Meet the maker', title: 'Hi, I’m June', more_label: 'Read my story', page_title: 'How Aurora began' });
    expect(h.sections.markets).toMatchObject({ title: 'Find us in person', page_title: 'Where we’ll be', more_label: 'See all dates' });
    expect(h.sections.close).toMatchObject({ kicker: 'Stay a while', title: 'Light one tonight', more_label: 'Shop now', more_target: 'shop' });
    expect(h.sections.contact).toMatchObject({ title: 'Say hello', lede: 'Questions about a scent? Write any time.' });
  });

  it('puts the story, quote and marquee in About you, and the portrait aside', () => {
    expect(h.profile).toMatchObject({ bio: 'It started in my kitchen.\n\nNow it fills a barn.', quote: 'Every candle starts with a memory.', quote_attribution: 'June, founder of Aurora', marquee_phrases: ['Small batch', 'Clean burn', 'Made in RI'] });
    expect(h.portraitUrl).toBe('https://cdn/portrait.jpg');
  });

  it('keeps testimonials, and only dated markets, naming the ones it can’t place', () => {
    expect(h.testimonials).toEqual([{ quote: 'My whole house smells like a cabin', name: 'Dana', detail: 'Cranston' }, { quote: 'Burns for days', name: 'Lee', detail: null }]);
    expect(h.markets).toEqual([{ date: '2026-10-17', name: 'Wickford Art Festival', hours: '10–5' }]);
    expect(h.undatedMarkets).toEqual(['Saturdays · Downtown Makers Market · 9–3']);
  });

  it('gives a button without a stored page the page the old design sent it to', () => {
    const r = homesFromLegacy({ ...legacy, moment: { ...legacy.moment, ctaTarget: undefined, secondaryCtaTarget: undefined }, close: { ...legacy.close, ctaTarget: undefined } });
    expect(r.moment).toMatchObject({ cta_target: 'shop', second_cta_target: 'shop' });
    expect(r.sections.close?.more_target).toBe('shop');
  });

  it('reads the old on/off intro flag', () => {
    expect(homesFromLegacy({ ...legacy, moment: { ...legacy.moment, playMode: undefined, playIntro: false } }).moment.play_mode).toBe('off');
    expect(homesFromLegacy({ ...legacy, moment: { ...legacy.moment, playMode: undefined } }).moment.play_mode).toBe('once');
  });

  it('skips sections with nothing in them', () => {
    const r = homesFromLegacy({ ...legacy, collections: undefined, reviews: undefined, contact: undefined, about: undefined, founder: { ...legacy.founder, findUs: undefined } });
    expect(r.sections.collections).toBeUndefined();
    expect(r.sections.reviews).toBeUndefined();
    expect(r.sections.markets).toBeUndefined();
    expect(r.sections.contact).toBeUndefined();
    expect(r.profile.bio).toBeNull();
    expect(r.testimonials).toEqual([]);
  });

  it('refuses words that don’t fit a home rather than cutting them', () => {
    expect(() => homesFromLegacy({ ...legacy, moment: { ...legacy.moment, eyebrow: 'x'.repeat(61) } })).toThrow('The moment’s words don’t fit');
    expect(() => homesFromLegacy({ ...legacy, goods: { title: 'x'.repeat(161) } })).toThrow('The work section’s words don’t fit');
    expect(() => homesFromLegacy({ ...legacy, founder: { ...legacy.founder, quote: 'q'.repeat(601) } })).toThrow('About you doesn’t fit');
  });
});

describe('a round trip through the homes', () => {
  it('lands every word back in its section', () => {
    const h = homesFromLegacy(legacy);
    const rows = Object.entries(h.sections).map(([section, row]) => ({ section, ...row }));
    const view = familyViewFromHomes({
      name: 'Aurora Candles',
      sellsOnline: true,
      moment: {
        ...momentFormFromRow(h.moment),
        media: { kind: 'video', url: h.momentMediaUrl ?? '', alt: 'A candle flickering', posterUrl: h.momentPosterUrl ?? '' },
        photos: h.momentPhotoUrls.map((p, i) => ({ id: `p${i}`, ...p })),
      },
      sections: sectionsFromRows(rows),
      profile: profileFormFromRow(h.profile),
      portraitUrl: h.portraitUrl,
      testimonials: h.testimonials.map((t, i) => ({ id: `t${i}`, quote: t.quote, name: t.name, detail: t.detail ?? '' })),
      dates: h.markets.map((m, i) => ({ id: `d${i}`, date: m.date, endDate: '', name: m.name, town: '', hours: m.hours, address: '', booth: '', url: '', canceled: false })),
    }, keyWords(FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX));
    expect(view.moment).toMatchObject({
      story: legacy.moment.story, eyebrow: legacy.moment.eyebrow, brand: legacy.moment.brand, sub: legacy.moment.sub,
      ctaLabel: legacy.moment.ctaLabel, ctaTarget: 'shop', secondaryCtaLabel: 'Our story', secondaryCtaTarget: 'about',
      media: { kind: 'video', url: 'https://cdn/hero/clip.mp4', poster: 'https://cdn/hero/poster.jpg' },
    });
    expect(view.goods).toEqual({ title: legacy.goods.title, label: legacy.goods.label, viewAllLabel: legacy.goods.viewAllLabel });
    expect(view.collections).toEqual({ title: 'Shop by scent', label: 'Collections', viewAllLabel: 'All collections' });
    expect(view.reviews?.items).toEqual(legacy.reviews?.items.map((t) => ({ ...t, location: t.location })));
    expect(view.marquee).toEqual(legacy.marquee);
    expect(view.founder).toMatchObject({ quote: legacy.founder.quote, attribution: legacy.founder.attribution, eyebrow: 'Meet the maker', heading: 'Hi, I’m June', aboutLabel: 'Read my story', photo: { url: 'https://cdn/portrait.jpg' } });
    expect(view.founder.findUs).toMatchObject({ label: 'Find us in person', title: 'Where we’ll be', eventsLabel: 'See all dates', rows: [{ where: 'Wickford Art Festival', time: '10–5', date: '2026-10-17' }] });
    expect(view.close).toEqual(legacy.close);
    expect(view.about).toEqual(legacy.about);
    expect(view.contact).toEqual(legacy.contact);
  });
});
