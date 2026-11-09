import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { familyMood, hiddenFamilySections, homeSectionsFor, isHomeSection, loadHomeSwitches, sectionOn, type HomeSection } from './home-sections';
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

/** One query's answer, as the database would give it; keeps the table and filters asked for. */
function answerDb(answer: { data: unknown; error: { message: string } | null }) {
  const asked: { table: string; eqs: unknown[][] } = { table: '', eqs: [] };
  const db = {
    from: (table: string) => {
      asked.table = table;
      const chain = {
        select: () => chain,
        eq: (...a: unknown[]) => {
          asked.eqs.push(a);
          return chain;
        },
        maybeSingle: () => Promise.resolve(answer),
        then: (ok: (v: unknown) => unknown, bad?: (e: unknown) => unknown) => Promise.resolve(answer).then(ok, bad),
      };
      return chain;
    },
  };
  return { db: db as unknown as SupabaseClient<Database>, asked };
}

describe('isHomeSection', () => {
  it('knows the home page’s own section names and nothing else', () => {
    expect(isHomeSection('marquee')).toBe(true);
    expect(isHomeSection('gallery')).toBe(true);
    expect(isHomeSection('hero')).toBe(false);
    expect(isHomeSection('goods')).toBe(false);
  });
});

describe('loadHomeSwitches', () => {
  it('reads this site’s switches, keeping only home page sections', async () => {
    const { db, asked } = answerDb({
      data: [
        { section: 'reviews', enabled: false },
        { section: 'gallery', enabled: true },
        { section: 'not-a-section', enabled: false },
      ],
      error: null,
    });
    const got = await loadHomeSwitches(db, 't1');
    expect([...got]).toEqual([
      ['reviews', false],
      ['gallery', true],
    ]);
    expect(asked).toEqual({ table: 'site_added_sections', eqs: [['tenant_id', 't1']] });
  });

  it('has no switches when nothing is saved', async () => {
    expect((await loadHomeSwitches(answerDb({ data: null, error: null }).db, 't1')).size).toBe(0);
  });

  it('says when the switches cannot be read', async () => {
    await expect(loadHomeSwitches(answerDb({ data: null, error: { message: 'offline' } }).db, 't1')).rejects.toThrow('Could not read the home page switches: offline');
  });
});

describe('homeSectionsFor, by plan', () => {
  it('shows collections only with the catalog too, and the scrolling line only with the profile', () => {
    const noCatalog = homeSectionsFor('rustic', new Set<FeatureKey>(['collections', 'profile']));
    expect(noCatalog).not.toContain('collections');
    expect(noCatalog).toContain('marquee');
    expect(homeSectionsFor('rustic', new Set<FeatureKey>(['catalog']))).not.toContain('marquee');
  });
});

describe('familyMood', () => {
  it('gives the mood of a family design’s home page record', async () => {
    const { db, asked } = answerDb({ data: { layout_tree: { root: { archetypeKey: 'main-street', mood: 'rustic' } } }, error: null });
    expect(await familyMood(db, 't1')).toBe('rustic');
    expect(asked).toEqual({ table: 'content_pages', eqs: [['tenant_id', 't1'], ['slug', '/']] });
  });

  it('gives an empty mood for a family design that names none', async () => {
    expect(await familyMood(answerDb({ data: { layout_tree: { root: { archetypeKey: 'main-street' } } }, error: null }).db, 't1')).toBe('');
    expect(await familyMood(answerDb({ data: { layout_tree: { root: { archetypeKey: 'main-street', mood: 7 } } }, error: null }).db, 't1')).toBe('');
  });

  it('gives nothing for a custom design, a page with no tree, or no home page', async () => {
    expect(await familyMood(answerDb({ data: { layout_tree: { root: { archetypeKey: 'shoreline', mood: 'scenic' } } }, error: null }).db, 't1')).toBeNull();
    expect(await familyMood(answerDb({ data: { layout_tree: {} }, error: null }).db, 't1')).toBeNull();
    expect(await familyMood(answerDb({ data: { layout_tree: null }, error: null }).db, 't1')).toBeNull();
    expect(await familyMood(answerDb({ data: null, error: null }).db, 't1')).toBeNull();
  });

  it('says when the design cannot be read', async () => {
    await expect(familyMood(answerDb({ data: null, error: { message: 'offline' } }).db, 't1')).rejects.toThrow('Could not read the site’s design: offline');
  });
});
