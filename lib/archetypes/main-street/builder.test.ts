import { describe, it, expect } from 'vitest';
import { MAIN_STREET_BUILDER } from './builder';
import type { MainStreetContent } from './schemas';

const baseContent = {
  shopName: 'Tannery Row',
  identity: { wordmark: 'Tannery Row', nav: ['Shop', 'About'] },
  moment: {
    media: { kind: 'video', prompt: 'slow hands stitching leather at a bench', alt: 'a maker at the bench' },
    story: ['cut by hand', 'stitched to last'],
    eyebrow: 'Made in the workshop',
    brand: 'Tannery Row',
    ctaLabel: 'See the work',
  },
  goods: { title: 'The bench' },
  founder: {
    quote: 'I would rather make one belt that lasts thirty years than ten that do not.',
    attribution: 'Sam, founder',
    photo: { prompt: 'portrait of the maker holding a knife roll', alt: 'the maker' },
  },
  close: { label: 'Come by', headline: 'Built to outlast us', ctaLabel: 'Order yours' },
} as unknown as MainStreetContent;

describe('MAIN_STREET_BUILDER', () => {
  it('declares the hero video and the founder portrait as media jobs', () => {
    const jobs = MAIN_STREET_BUILDER.mediaJobs(baseContent);
    const hero = jobs.find((j) => j.id === 'hero');
    const portrait = jobs.find((j) => j.id === 'portrait');
    expect(hero?.kind).toBe('video');
    expect(hero?.prompt).toContain('stitching leather');
    expect(portrait?.kind).toBe('still');
    expect(portrait?.prompt).toContain('knife roll');
  });

  it('folds generated URLs back into the content', () => {
    const out = MAIN_STREET_BUILDER.applyMedia(baseContent, {
      hero: 'https://cdn/clip.mp4',
      portrait: 'https://cdn/portrait.jpg',
    });
    expect(out.moment.media.url).toBe('https://cdn/clip.mp4');
    expect(out.founder.photo.url).toBe('https://cdn/portrait.jpg');
  });

  it('leaves media url unset when generation failed (null)', () => {
    const out = MAIN_STREET_BUILDER.applyMedia(baseContent, { hero: null, portrait: null });
    expect(out.moment.media.url).toBeUndefined();
  });

  it('validates content through the schema', () => {
    expect(MAIN_STREET_BUILDER.parseContent(baseContent).ok).toBe(true);
    expect(MAIN_STREET_BUILDER.parseContent({ shopName: 'x' }).ok).toBe(false);
  });
});
