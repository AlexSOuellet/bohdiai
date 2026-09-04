/**
 * Tests — collage-source projection (D73).
 *
 * The rule turns on TWO inputs, not one:
 *
 *   currentFamily — the family currently painting the store (may be a try-on).
 *   originalMood  — the tenant's original mood at onboarding (tenant.mood_key).
 *
 * Only when originalMood === 'cheerful' do we trust existing `moment.collageShots`
 * (native Cheerful — walk kept AI or maker uploaded). For any non-Cheerful native
 * tenant trying on Cheerful, we IGNORE stale AI collage shots that were generated
 * before the pipeline gate landed and always derive from real products. If neither
 * path yields shots, the moment passes through and the CollageHero renders sparse.
 */
import { describe, it, expect } from 'vitest';
import { resolveCollageShots } from './collage-source';
import { FAMILIES } from './families';
import type { MainStreetContent } from './schemas';
import type { ProductView } from '../content';

const baseMoment: MainStreetContent['moment'] = {
  media: {
    kind: 'still',
    prompt: { composition: 'a', subject: 'b', environment: 'c', atmosphere: 'd', camera: 'e', lighting: 'f', style: 'g' },
    url: '/hero.jpg',
    alt: 'a hero',
  },
  story: ['line one'],
  eyebrow: 'eyebrow',
  brand: 'Brand',
  ctaLabel: 'Shop',
};

const shot = (label: string, url?: string) => ({
  prompt: { composition: label, subject: label, environment: label, atmosphere: label, camera: label, lighting: label, style: label },
  alt: label,
  ...(url ? { url } : {}),
});

const product = (name: string, url?: string): ProductView => ({
  slug: name.toLowerCase().replace(/\s+/g, '-'),
  name,
  price: '$10',
  description: '',
  status: 'active',
  media: url ? [{ kind: 'image', url, alt: name }] : [],
  variations: [],
});

describe('resolveCollageShots — native Cheerful trusts its shots; try-on Cheerful pulls from products (D73)', () => {
  it('passes through unchanged for non-Cheerful CURRENT families regardless of state', () => {
    const products = [product('one', '/p1.jpg'), product('two', '/p2.jpg')];
    for (const key of ['cozy', 'rustic', 'dark', 'luxury', 'modern'] as const) {
      const family = FAMILIES[key];
      const out = resolveCollageShots(baseMoment, family, products, 'cheerful');
      expect(out).toBe(baseMoment);
    }
  });

  it('passes through unchanged when family is undefined (preview/test callers without a family resolved)', () => {
    const out = resolveCollageShots(baseMoment, undefined, [product('one', '/p1.jpg')], 'cheerful');
    expect(out).toBe(baseMoment);
  });

  it('native Cheerful (originalMood === cheerful): keeps existing collageShots as-is', () => {
    const moment = { ...baseMoment, collageShots: [shot('a', '/a.jpg'), shot('b', '/b.jpg'), shot('c', '/c.jpg')] };
    const products = [product('should-not-be-used', '/should-not.jpg')];
    const out = resolveCollageShots(moment, FAMILIES.cheerful, products, 'cheerful');
    expect(out.collageShots).toBe(moment.collageShots);
  });

  it('native Cheerful with one uploaded + two AI (all carry urls): keeps existing as-is', () => {
    const moment = { ...baseMoment, collageShots: [shot('uploaded', '/u.jpg'), shot('ai-one', '/ai1.jpg'), shot('ai-two', '/ai2.jpg')] };
    const out = resolveCollageShots(moment, FAMILIES.cheerful, [product('unused', '/x.jpg')], 'cheerful');
    expect(out.collageShots).toBe(moment.collageShots);
  });

  it('try-on Cheerful (originalMood !== cheerful): IGNORES stale collageShots and derives from products', () => {
    // Non-Cheerful tenants built before the pipeline gate still have three AI-generated
    // collage shots with resolved urls. Try-on Cheerful must NOT render those stale
    // shots — the whole point of the direction is that try-on shows real products.
    const moment = { ...baseMoment, collageShots: [shot('stale-a', '/stale-a.jpg'), shot('stale-b', '/stale-b.jpg'), shot('stale-c', '/stale-c.jpg')] };
    const products = [product('candle', '/c.jpg'), product('soap', '/s.jpg'), product('balm', '/b.jpg')];
    const out = resolveCollageShots(moment, FAMILIES.cheerful, products, 'cozy');
    expect(out.collageShots!.map((s) => s.url)).toEqual(['/c.jpg', '/s.jpg', '/b.jpg']);
  });

  it('try-on Cheerful with no products: passes through so CollageHero renders sparse (no fill)', () => {
    const moment = { ...baseMoment, collageShots: [shot('stale', '/stale.jpg')] };
    // With no products AND originalMood is non-cheerful, we can't derive — but we also
    // shouldn't render stale AI shots. Return moment unchanged and let the CollageHero
    // filter surface an honest empty state.
    const out = resolveCollageShots(moment, FAMILIES.cheerful, [], 'cozy');
    expect(out).toBe(moment);
  });

  it('derives three collage shots from the first three products with images when collageShots is absent (native Cheerful edge case)', () => {
    const products = [
      product('candle', '/c.jpg'),
      product('soap', '/s.jpg'),
      product('balm', '/b.jpg'),
      product('extra', '/e.jpg'),
    ];
    const out = resolveCollageShots(baseMoment, FAMILIES.cheerful, products, 'cheerful');
    expect(out.collageShots).toHaveLength(3);
    expect(out.collageShots!.map((s) => s.url)).toEqual(['/c.jpg', '/s.jpg', '/b.jpg']);
    expect(out.collageShots!.map((s) => s.alt)).toEqual(['candle', 'soap', 'balm']);
  });

  it('derives fewer than three shots when fewer products have images (sparse — no fill)', () => {
    const products = [product('only', '/only.jpg'), product('no-image')];
    const out = resolveCollageShots(baseMoment, FAMILIES.cheerful, products, 'cozy');
    expect(out.collageShots).toHaveLength(1);
    expect(out.collageShots![0]!.url).toBe('/only.jpg');
  });

  it('skips products that have no image and continues to the next', () => {
    const products = [
      product('no-image-a'),
      product('has-image', '/has.jpg'),
      product('no-image-b'),
      product('also-has', '/also.jpg'),
    ];
    const out = resolveCollageShots(baseMoment, FAMILIES.cheerful, products, 'cozy');
    expect(out.collageShots!.map((s) => s.url)).toEqual(['/has.jpg', '/also.jpg']);
  });

  it('returns moment unchanged when Cheerful has no collageShots AND no products with images (sparse render, no fill)', () => {
    const out = resolveCollageShots(baseMoment, FAMILIES.cheerful, [product('none-a'), product('none-b')], 'cheerful');
    expect(out).toBe(baseMoment);
    expect(out.collageShots).toBeUndefined();
  });

  it('originalMood undefined: treats as non-native-Cheerful (try-on behavior — safe default)', () => {
    const moment = { ...baseMoment, collageShots: [shot('stale', '/stale.jpg')] };
    const products = [product('real', '/real.jpg')];
    const out = resolveCollageShots(moment, FAMILIES.cheerful, products);
    expect(out.collageShots![0]!.url).toBe('/real.jpg');
  });
});
