import { describe, it, expect } from 'vitest';
import { MAIN_STREET_SPEC } from './builder';

function scene() {
  return {
    composition: 'close on a workbench',
    subject: 'steam curling off a pot',
    environment: 'a dim workshop',
    atmosphere: 'warm and patient',
    camera: 'locked off, shallow depth',
    lighting: 'a single amber lamp',
    style: 'photographic, deep shadow',
  };
}

function submission(kind: 'video' | 'image') {
  return {
    content: {
      shopName: 'Tannery Row',
      identity: { wordmark: 'Tannery Row', nav: ['Shop', 'About'] },
      moment: {
        media: { kind, prompt: scene(), alt: 'a workshop bench' },
        story: ['full-grain hide', 'every hole by hand'],
        eyebrow: 'Made one at a time',
        brand: 'Tannery Row',
        ctaLabel: 'See the work',
      },
      goods: { title: 'From the bench' },
      founder: {
        quote: 'I started with one knife and a scrap of hide, and I still cut every piece myself',
        attribution: 'Sam, founder',
        photo: { prompt: 'the maker at the bench', alt: 'Sam at the bench' },
      },
      close: { label: 'Come by', headline: 'Built to outlast you', ctaLabel: 'Order custom' },
    },
    products: [
      { name: 'Belt', slug: 'belt', shortDescription: 'a belt', description: 'a sturdy leather belt', basePriceCents: 8800, imagePrompt: 'a belt on wood' },
      { name: 'Wallet', slug: 'wallet', shortDescription: 'a wallet', description: 'a bifold leather wallet', basePriceCents: 6500, imagePrompt: 'a wallet on wood' },
      { name: 'Key fob', slug: 'key-fob', shortDescription: 'a fob', description: 'a small leather key fob', basePriceCents: 2400, imagePrompt: 'a key fob on wood' },
    ],
  };
}

describe('MAIN_STREET_SPEC.mediaJobs — hero follows the authored kind', () => {
  it('generates a VIDEO hero (JSON prompt) when kind is video', () => {
    const parsed = MAIN_STREET_SPEC.parseSubmission(submission('video'));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const hero = MAIN_STREET_SPEC.mediaJobs(parsed.authored).find((j) => j.id === 'hero')!;
    expect(hero.kind).toBe('video');
    expect(JSON.parse(hero.prompt).loop).toMatch(/seamless/i);
  });

  it('generates a STILL hero (prose prompt) when kind is image', () => {
    const parsed = MAIN_STREET_SPEC.parseSubmission(submission('image'));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const hero = MAIN_STREET_SPEC.mediaJobs(parsed.authored).find((j) => j.id === 'hero')!;
    expect(hero.kind).toBe('still');
    expect(hero.aspect).toBe('16:9');
    expect(() => JSON.parse(hero.prompt)).toThrow(); // prose, not JSON
  });
});
