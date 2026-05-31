import { describe, expect, test } from 'vitest';
import { computeNavPlacement } from './nav-placement';

describe('computeNavPlacement', () => {
  test('home is not in the navbar', () => {
    const placements = computeNavPlacement([{ slug: 'home', name: 'Home' }]);
    expect(placements[0]?.isInNav).toBe(false);
  });

  test('shop, about, and contact are in the navbar in that fixed order with clean labels', () => {
    // Passed out of order on purpose: order must come from policy, not insertion order.
    const placements = computeNavPlacement([
      { slug: '/contact', name: "Contact. Brian's Candles" },
      { slug: '/about', name: 'About Brian' },
      { slug: '/shop', name: 'Shop All Candles' },
    ]);
    const [contact, about, shop] = placements;
    expect(shop).toEqual({ isInNav: true, navLabel: 'Shop', navPosition: 10 });
    expect(about).toEqual({ isInNav: true, navLabel: 'About', navPosition: 20 });
    expect(contact).toEqual({ isInNav: true, navLabel: 'Contact', navPosition: 30 });
  });

  test('a generated page like events goes in the navbar after the required pages, labeled from its name', () => {
    const placements = computeNavPlacement([
      { slug: '/shop', name: 'Shop' },
      { slug: '/events', name: 'Events' },
    ]);
    expect(placements[1]).toEqual({ isInNav: true, navLabel: 'Events', navPosition: 40 });
  });

  test('two generated pages get distinct, increasing positions', () => {
    const placements = computeNavPlacement([
      { slug: '/events', name: 'Events' },
      { slug: '/calendar', name: 'Calendar' },
    ]);
    expect(placements[0]?.navPosition).toBe(40);
    expect(placements[1]?.navPosition).toBe(50);
  });

  test('privacy and terms are footer-only, never in the navbar', () => {
    const placements = computeNavPlacement([
      { slug: '/privacy', name: 'Privacy Policy' },
      { slug: '/terms', name: 'Terms of Service' },
    ]);
    expect(placements[0]?.isInNav).toBe(false);
    expect(placements[1]?.isInNav).toBe(false);
  });
});
