import { describe, it, expect } from 'vitest';
import { buildMarqueeLines } from './marquee';
import type { MainStreetContent } from './schemas';
import type { CollectionView } from '../content';

const base: MainStreetContent = {
  shopName: 'Tannery Row',
  identity: { wordmark: 'Tannery Row' },
  moment: {
    media: {
      kind: 'still',
      prompt: { composition: 'bench', subject: 'a wallet', environment: 'a workshop', atmosphere: 'warm', camera: 'still', lighting: 'amber', style: 'photographic' },
      alt: 'the bench',
    },
    story: ['cut by hand'],
    eyebrow: 'Made in the workshop',
    brand: 'Tannery Row',
    ctaLabel: 'See the work',
  },
  goods: { title: 'The bench', label: 'The collection' },
  founder: {
    quote: 'I would rather make one belt that lasts.',
    attribution: 'Sam, founder',
    photo: { prompt: 'the maker at the bench', alt: 'the maker' },
  },
  close: { label: 'Come by', headline: 'Built to outlast us', ctaLabel: 'Order yours' },
};

describe('buildMarqueeLines — content is assembled from the store, never hardcoded', () => {
  it('uses the marquee voice Bohdi authored when present', () => {
    const authored: MainStreetContent = { ...base, marquee: { voice: ['Hand cut', 'Built to last'] } };
    const { voice } = buildMarqueeLines(authored);
    expect(voice).toEqual(['Hand cut', 'Built to last']);
    // does NOT fall back to the other authored copy when its own voice exists
    expect(voice).not.toContain('Made in the workshop');
  });

  it('falls back to deriving the voice from other authored copy for legacy stores', () => {
    const { voice } = buildMarqueeLines(base); // no marquee field
    expect(voice).toContain('Made in the workshop'); // eyebrow
    expect(voice).toContain('The collection'); // goods label
    expect(voice).toContain('Come by'); // close label
    expect(voice).toContain('Built to outlast us'); // close headline
  });

  it('builds the info line from the store’s live data (find-us dates + collections)', () => {
    const withData: MainStreetContent = {
      ...base,
      founder: { ...base.founder, findUs: { label: 'Find us', rows: [{ day: 'Sat', where: 'Riverside Market', time: '9am' }] } },
    };
    const collections: CollectionView[] = [{ slug: 'holiday', name: 'Holiday', count: 3 }];
    const { info } = buildMarqueeLines(withData, collections);
    expect(info).toContain('Riverside Market · Sat 9am');
    expect(info).toContain('Holiday');
  });

  it('leaves the info line empty when the store has no dates or collections', () => {
    const { info } = buildMarqueeLines(base, []);
    expect(info).toEqual([]);
  });

  it('de-duplicates so a phrase authored twice only scrolls once', () => {
    const dupe: MainStreetContent = { ...base, goods: { ...base.goods, label: 'Come by' } };
    const { voice } = buildMarqueeLines(dupe);
    expect(voice.filter((p) => p.toLowerCase() === 'come by')).toHaveLength(1);
  });

  it('omits a missing optional label without emitting an empty phrase', () => {
    const noLabel: MainStreetContent = { ...base, goods: { title: 'The bench' } };
    const { voice } = buildMarqueeLines(noLabel);
    expect(voice.every((p) => p.trim().length > 0)).toBe(true);
    expect(voice).not.toContain('The collection');
  });
});
