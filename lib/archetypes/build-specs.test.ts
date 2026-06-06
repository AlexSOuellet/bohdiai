import { describe, it, expect } from 'vitest';
import { MAIN_STREET_SPEC } from './main-street/builder';

const msContent = {
  shopName: 'Tannery Row',
  identity: { wordmark: 'Tannery Row', nav: ['Shop', 'About'] },
  moment: {
    media: {
      kind: 'video',
      prompt: {
        composition: 'close on a workbench, a half-finished wallet in frame',
        subject: 'steam curling off a beeswax pot',
        environment: 'a dim leather workshop',
        atmosphere: 'warm and patient',
        camera: 'locked off, shallow depth of field',
        lighting: 'a single amber work lamp',
        style: 'photographic, deep shadow, warm palette',
      },
      alt: 'maker at the bench',
    },
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
};
const msProducts = [
  { name: 'Belt', slug: 'belt', shortDescription: 'A full-grain belt', description: 'A belt cut from one hide.', basePriceCents: 9800, imagePrompt: 'a leather belt coiled on wood' },
  { name: 'Wallet', slug: 'wallet', shortDescription: 'A bifold wallet', description: 'Saddle-stitched bifold.', basePriceCents: 6800, imagePrompt: 'a leather wallet on stone' },
  { name: 'Tote', slug: 'tote', shortDescription: 'A market tote', description: 'A roomy everyday tote.', basePriceCents: 22000, imagePrompt: 'a leather tote on a bench' },
];

describe('catalog-size gate', () => {
  it('Main Street fits any catalog size (the home is a sampling)', () => {
    expect(MAIN_STREET_SPEC.fitsCatalog(1)).toBe(true);
    expect(MAIN_STREET_SPEC.fitsCatalog(6)).toBe(true);
    expect(MAIN_STREET_SPEC.fitsCatalog(45)).toBe(true);
  });

});

describe('MAIN_STREET_SPEC', () => {
  it('offers the full deep skin shelf as looks and a menu description', () => {
    expect(MAIN_STREET_SPEC.looks.length).toBe(29);
    expect(MAIN_STREET_SPEC.menuDescription.length).toBeGreaterThan(20);
  });

  it('validates a full submission (content + products)', () => {
    const r = MAIN_STREET_SPEC.parseSubmission({ content: msContent, products: msProducts });
    expect(r.ok).toBe(true);
  });

  it('declares hero video + portrait as feature jobs and one product job per product', () => {
    const r = MAIN_STREET_SPEC.parseSubmission({ content: msContent, products: msProducts });
    if (!r.ok) throw new Error('expected ok');
    const jobs = MAIN_STREET_SPEC.mediaJobs(r.authored);
    expect(jobs.find((j) => j.id === 'hero')?.group).toBe('feature');
    expect(jobs.find((j) => j.id === 'hero')?.kind).toBe('video');
    expect(jobs.find((j) => j.id === 'portrait')?.group).toBe('feature');
    expect(jobs.filter((j) => j.group === 'product').length).toBe(3);
  });

  it('marks the founder portrait as a person image and the hero/products as not', () => {
    const r = MAIN_STREET_SPEC.parseSubmission({ content: msContent, products: msProducts });
    if (!r.ok) throw new Error('expected ok');
    const jobs = MAIN_STREET_SPEC.mediaJobs(r.authored);
    expect(jobs.find((j) => j.id === 'portrait')?.subjectIsPerson).toBe(true);
    expect(jobs.find((j) => j.id === 'hero')?.subjectIsPerson ?? false).toBe(false);
    expect(jobs.filter((j) => j.group === 'product').every((j) => !j.subjectIsPerson)).toBe(true);
  });

  it('folds media in and builds ProductViews via toPayload', () => {
    const r = MAIN_STREET_SPEC.parseSubmission({ content: msContent, products: msProducts });
    if (!r.ok) throw new Error('expected ok');
    const withMedia = MAIN_STREET_SPEC.applyMedia(r.authored, {
      hero: 'https://cdn/clip.mp4',
      portrait: 'https://cdn/p.jpg',
      'product:0': 'https://cdn/0.jpg',
      'product:1': 'https://cdn/0.jpg', // recycled
      'product:2': 'https://cdn/0.jpg',
    });
    const payload = MAIN_STREET_SPEC.toPayload(withMedia);
    expect(payload.products.length).toBe(3);
    expect(payload.products[0]!.price).toBe('$98');
    expect(payload.products[0]!.media[0]?.url).toBe('https://cdn/0.jpg');
    expect((payload.content as typeof msContent).moment.media).toMatchObject({ url: 'https://cdn/clip.mp4' });
  });
});
