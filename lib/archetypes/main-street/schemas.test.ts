import { describe, it, expect } from 'vitest';
import { MainStreetContentSchema } from './schemas';

function valid() {
  return {
    shopName: "June's Sourdough",
    identity: { wordmark: "June's Sourdough", nav: ['Shop', 'About', 'Find us'] },
    moment: {
      media: { kind: 'video', prompt: 'Steam rising off a cracked sourdough crust, slow', alt: 'A loaf cooling' },
      story: ['It starts the night before', 'Folded by hand and left to rise slow', 'Pulled from the oven at first light'],
      eyebrow: 'Baked fresh every morning',
      brand: "June's Sourdough",
      ctaLabel: 'See the loaves',
    },
    goods: { title: 'Pulled from the oven this morning' },
    founder: {
      quote: 'I started with one cast-iron oven and a starter named Frank, and fourteen years on he still does most of the work',
      attribution: 'June Carter, founder and baker',
      photo: { prompt: 'A baker holding a loaf in a warm kitchen', alt: 'June in her kitchen' },
      findUs: {
        label: 'Find us this week',
        rows: [
          { day: 'Wed', where: 'Riverside Farmers Market', time: '8-1' },
          { day: 'Sat', where: 'Downtown Makers Market', time: '9-2' },
        ],
      },
    },
    close: { label: 'Come say hello', headline: 'Warm bread is on Main Street by seven', ctaLabel: 'Order for pickup' },
  };
}

describe('MainStreetContentSchema', () => {
  it('accepts a complete valid store', () => {
    expect(MainStreetContentSchema.safeParse(valid()).success).toBe(true);
  });

  it('accepts a store with findUs omitted', () => {
    const c = valid();
    delete (c.founder as Record<string, unknown>)['findUs'];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('requires at least two story lines', () => {
    const c = valid();
    c.moment.story = ['only one'];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(false);
  });

  it('caps the story line length', () => {
    const c = valid();
    c.moment.story = ['x'.repeat(60), 'ok line'];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(false);
  });

  it('caps the story at four lines', () => {
    const c = valid();
    c.moment.story = ['line one', 'line two', 'line three', 'line four', 'line five'];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(false);
  });

  it('rejects punctuation in a story line', () => {
    const c = valid();
    c.moment.story = ['Flour. Water. Salt. Time.', 'No shortcuts'];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(false);
  });

  it('rejects a comma in a story line', () => {
    const c = valid();
    c.moment.story = ['Made in small batches, every week', 'Real bread for real people'];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(false);
  });

  it('allows apostrophes and intra-word hyphens in story lines', () => {
    const c = valid();
    c.moment.story = ["don't rush it", 'cut from full-grain hides'];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('accepts a Bohdi-authored goods treatment', () => {
    const c = valid();
    (c.goods as Record<string, unknown>)['treatment'] = 'marquee';
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('rejects an unknown goods treatment', () => {
    const c = valid();
    (c.goods as Record<string, unknown>)['treatment'] = 'mosaic';
    expect(MainStreetContentSchema.safeParse(c).success).toBe(false);
  });

  it('rejects fewer than 2 nav items', () => {
    const c = valid();
    c.identity.nav = ['Shop'];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(false);
  });

  it('caps the close headline', () => {
    const c = valid();
    c.close.headline = 'x'.repeat(80);
    expect(MainStreetContentSchema.safeParse(c).success).toBe(false);
  });
});
