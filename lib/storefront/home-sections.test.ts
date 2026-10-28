import { describe, it, expect } from 'vitest';
import { hiddenFamilySections, homeSectionsFor, sectionOn, type HomeSection } from './home-sections';
import type { FeatureKey } from '@/lib/backend/features';

const full = new Set<FeatureKey>(['catalog', 'collections', 'testimonials', 'market_dates', 'gallery', 'profile']);
const showcase = new Set<FeatureKey>(['gallery_pieces', 'market_dates', 'profile']);
const switches = (pairs: [HomeSection, boolean][]) => new Map(pairs);

describe('home page section switches (Alex, 2026-10-27)', () => {
  it('shows every section until she turns it off, except the gallery, which waits to be turned on', () => {
    expect(sectionOn(switches([]), 'reviews')).toBe(true);
    expect(sectionOn(switches([]), 'gallery')).toBe(false);
    expect(sectionOn(switches([['reviews', false], ['gallery', true]]), 'reviews')).toBe(false);
    expect(sectionOn(switches([['gallery', true]]), 'gallery')).toBe(true);
  });

  it('hides what she turned off by the family designs’ own names, leaving the gallery to its loader', () => {
    expect(hiddenFamilySections(switches([['work', false], ['about', false], ['markets', false], ['gallery', false], ['close', true]]))).toEqual(['goods', 'founder', 'findUs']);
  });

  it('lists a family site’s sections in its design’s order, the opening left out', () => {
    expect(homeSectionsFor('rustic', full)).toEqual(['marquee', 'about', 'work', 'gallery', 'markets', 'collections', 'reviews', 'close']);
  });

  it('leaves out what the plan doesn’t have', () => {
    const rows = homeSectionsFor('rustic', showcase);
    expect(rows).not.toContain('work');
    expect(rows).not.toContain('collections');
    expect(rows).not.toContain('reviews');
    expect(rows).not.toContain('gallery');
    expect(rows).toContain('about');
  });

  it('lists Scenic’s own home page, and nothing for a custom design', () => {
    expect(homeSectionsFor('scenic', full)).toEqual(['work', 'gallery', 'reviews', 'about', 'markets']);
    expect(homeSectionsFor(null, full)).toEqual([]);
  });
});
