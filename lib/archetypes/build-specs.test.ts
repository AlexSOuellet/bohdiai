import { describe, it, expect } from 'vitest';
import { MAIN_STREET_SPEC } from './main-street/builder';
import { GALLERY_SPEC } from './gallery/builder';
import type { GalleryContent } from './gallery/schemas';

const msContent = {
  shopName: 'Tannery Row',
  identity: { wordmark: 'Tannery Row', nav: ['Shop', 'About'] },
  moment: {
    media: { kind: 'video', prompt: 'slow hands stitching leather at a bench', alt: 'maker at the bench' },
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

describe('MAIN_STREET_SPEC', () => {
  it('offers all seven skins as looks and a menu description', () => {
    expect(MAIN_STREET_SPEC.looks.length).toBe(7);
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

const galleryContent = {
  shopName: 'Quill & Stone',
  identity: { wordmark: 'Quill & Stone', tagline: 'Hand-set silver and river stone', nav: ['Shop', 'About'] },
  wall: {
    products: Array.from({ length: 8 }, (_, i) => ({
      name: `Piece ${i + 1}`,
      price: `$${40 + i * 10}`,
      photo: { prompt: `a silver pendant number ${i + 1} on slate`, alt: `pendant ${i + 1}` },
    })),
  },
  maker: {
    label: 'The Studio',
    headline: 'Set by hand at a river bench',
    body: 'I cut and set every stone myself at a bench by the water, one piece at a time, the way my grandmother taught me.',
    photo: { prompt: 'a jeweler at a bench by a window', alt: 'the maker' },
    ctaLabel: 'Read the story',
  },
  footer: {
    blurb: 'Hand-set silver from the river valley',
    columns: [
      { title: 'Shop', items: ['Rings', 'Pendants'] },
      { title: 'More', items: ['About', 'Contact'] },
    ],
  },
};

describe('GALLERY_SPEC', () => {
  it('offers its four themes as looks', () => {
    expect(GALLERY_SPEC.looks.length).toBe(4);
  });

  it('validates a wall submission and embeds products in content', () => {
    const r = GALLERY_SPEC.parseSubmission({ content: galleryContent });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const payload = GALLERY_SPEC.toPayload(r.authored);
    expect(payload.products.length).toBe(0); // products live in the wall, not as rows
  });

  it('declares every wall tile as a product job and the maker photo as a feature', () => {
    const r = GALLERY_SPEC.parseSubmission({ content: galleryContent });
    if (!r.ok) throw new Error('expected ok');
    const jobs = GALLERY_SPEC.mediaJobs(r.authored);
    expect(jobs.filter((j) => j.group === 'product').length).toBe(8);
    expect(jobs.find((j) => j.id === 'maker')?.group).toBe('feature');
  });

  it('folds a recycled photo set into the wall via applyMedia', () => {
    const r = GALLERY_SPEC.parseSubmission({ content: galleryContent });
    if (!r.ok) throw new Error('expected ok');
    const urls: Record<string, string> = { maker: 'https://cdn/maker.jpg' };
    for (let i = 0; i < 8; i++) urls[`product:${i}`] = `https://cdn/p${i % 5}.jpg`; // 5 unique, recycled
    const out = GALLERY_SPEC.applyMedia(r.authored, urls) as GalleryContent;
    expect(out.wall.products[0]!.photo.url).toBe('https://cdn/p0.jpg');
    expect(out.wall.products[6]!.photo.url).toBe('https://cdn/p1.jpg'); // 6 % 5 = 1
    expect(out.maker.photo.url).toBe('https://cdn/maker.jpg');
  });
});
