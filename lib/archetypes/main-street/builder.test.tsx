import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
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

describe('MAIN_STREET_SPEC.render — accentOverride baked into skin', () => {
  it('paints the baked accentOverride as the store accent (emitted as --ms-accent in the style tag)', () => {
    // Use the spec's real content shape via parseSubmission + toPayload
    const parsed = MAIN_STREET_SPEC.parseSubmission(submission('video'));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const content = MAIN_STREET_SPEC.toPayload(parsed.authored).content;
    // Pick the first available skin — 'main-street-ember' — which is a light skin
    const el = MAIN_STREET_SPEC.render({
      content,
      lookKey: 'main-street-ember',
      products: [],
      page: 'about',
      accentOverride: '#1d3a2e',
    });
    const { container } = render(el);
    // skinVarsCss emits --ms-accent:${p.accent} in a <style> tag; the raw hex
    // must appear literally in the rendered HTML (not converted by jsdom since
    // it's inside a <style> string, not a computed property)
    expect(container.innerHTML).toContain('#1d3a2e');
  });
});

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
