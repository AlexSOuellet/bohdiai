import { describe, it, expect } from 'vitest';
import { MainStreetContentSchema } from './schemas';

function validContent() {
  return {
    shopName: "June's Sourdough",
    identity: {
      wordmark: "June's Sourdough",
      tagline: 'Naturally leavened, by hand, in small batches',
      nav: ['Shop', 'About', 'Contact'],
    },
    hero: {
      headline: 'Naturally leavened, by hand',
      sub: 'Country, seeded, and a cinnamon-raisin special each week',
      ctaLabel: 'Shop the loaves',
      photo: { prompt: 'A rustic round sourdough loaf, scored and blistered crust', alt: 'A round sourdough loaf' },
    },
    featured: { title: 'This week' },
    maker: {
      label: 'Meet June',
      headline: 'One oven, one pair of hands',
      body: 'I started baking for neighbors and never stopped. Every loaf is mixed, folded, and shaped by hand the night before. I bake what I would want on my own table.',
      photo: { prompt: 'A baker in an apron holding a loaf, warm kitchen', alt: 'June in her kitchen' },
      ctaLabel: 'Read the full story',
    },
    secondary: {
      label: 'Where to find us',
      headline: 'Saturdays at the market',
      body: 'Find this week’s bake at the Hope Street Farmers Market, 9 to 11am.',
    },
    stayInTouch: {
      headline: 'Get next week’s bake list',
      body: 'One email a week, the loaves and the pickup details.',
      ctaLabel: 'Join the list',
    },
    footer: {
      blurb: 'Baked and sold in Providence, Rhode Island',
      columns: [
        { title: 'Shop', items: ['Loaves', 'Pickup', 'Gift cards'] },
        { title: 'Connect', items: ['Instagram', 'Email'] },
      ],
    },
  };
}

describe('MainStreetContentSchema', () => {
  it('accepts a complete valid store', () => {
    expect(MainStreetContentSchema.safeParse(validContent()).success).toBe(true);
  });

  it('accepts a store with the optional regions omitted', () => {
    const c = validContent();
    delete (c as Record<string, unknown>).secondary;
    delete (c as Record<string, unknown>).stayInTouch;
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('rejects a hero headline that exceeds the cap', () => {
    const c = validContent();
    c.hero.headline = 'x'.repeat(60);
    expect(MainStreetContentSchema.safeParse(c).success).toBe(false);
  });

  it('rejects fewer than 2 nav items', () => {
    const c = validContent();
    c.identity.nav = ['Shop'];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(false);
  });
});
