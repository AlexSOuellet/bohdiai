import { describe, it, expect } from 'vitest';
import { FAMILIES, FAMILY_KEYS, SECTION_KEYS, getFamily, type FamilyKey } from './families';
import { GOODS_TREATMENTS } from './goods';
import { COLLECTIONS_TREATMENTS } from './collections';
import { REVIEWS_TREATMENTS } from './reviews';
import { FINDUS_TREATMENTS } from './findus';
import { FOUNDER_TREATMENTS, NAV_VARIANTS } from './schemas';
import { HERO_CATALOG } from './hero-catalog';

const ALL_FAMILY_KEYS: readonly FamilyKey[] = FAMILY_KEYS;

describe('FAMILIES registry', () => {
  it('has exactly six families in the locked order', () => {
    expect(FAMILY_KEYS).toEqual(['cozy', 'rustic', 'dark', 'luxury', 'cheerful', 'modern']);
    expect(Object.keys(FAMILIES).sort()).toEqual([...ALL_FAMILY_KEYS].sort());
  });

  it.each(ALL_FAMILY_KEYS)('%s carries a section default for every section slot', (key) => {
    const f = FAMILIES[key];
    expect(f.sectionDefaults.hero).toBeTruthy();
    expect(f.sectionDefaults.goods).toBeTruthy();
    expect(f.sectionDefaults.collections).toBeTruthy();
    expect(f.sectionDefaults.reviews).toBeTruthy();
    expect(f.sectionDefaults.founder).toBeTruthy();
    expect(f.sectionDefaults.nav).toBeTruthy();
    expect(f.sectionDefaults.findUs).toBeTruthy();
  });

  it.each(ALL_FAMILY_KEYS)('%s picks valid variant IDs for every section', (key) => {
    const f = FAMILIES[key];
    expect(Object.keys(HERO_CATALOG)).toContain(f.sectionDefaults.hero);
    expect(GOODS_TREATMENTS).toContain(f.sectionDefaults.goods);
    expect(COLLECTIONS_TREATMENTS).toContain(f.sectionDefaults.collections);
    expect(REVIEWS_TREATMENTS).toContain(f.sectionDefaults.reviews);
    expect(FOUNDER_TREATMENTS).toContain(f.sectionDefaults.founder);
    expect(NAV_VARIANTS).toContain(f.sectionDefaults.nav);
    expect(FINDUS_TREATMENTS).toContain(f.sectionDefaults.findUs);
  });

  it.each(ALL_FAMILY_KEYS)('%s section stack has all nine slots in order, hero first, close last', (key) => {
    const stack = FAMILIES[key].sectionStack;
    expect(stack).toHaveLength(SECTION_KEYS.length);
    expect(stack[0]?.section).toBe('hero');
    expect(stack[stack.length - 1]?.section).toBe('close');
    // every SECTION_KEYS entry appears exactly once
    const stackKeys = stack.map((e) => e.section).sort();
    expect(stackKeys).toEqual([...SECTION_KEYS].sort());
  });

  it.each(ALL_FAMILY_KEYS)('%s has exactly one lead section (the opens-with)', (key) => {
    const stack = FAMILIES[key].sectionStack;
    const leads = stack.filter((e) => e.lead === true);
    expect(leads).toHaveLength(1);
    // the lead is never hero or close — those are the fixed brackets
    expect(leads[0]?.section).not.toBe('hero');
    expect(leads[0]?.section).not.toBe('close');
  });

  it.each(ALL_FAMILY_KEYS)('%s ships every section on at onboarding except Contact (not built yet)', (key) => {
    const stack = FAMILIES[key].sectionStack;
    for (const entry of stack) {
      if (entry.section === 'contact') {
        expect(entry.on).toBe(false);
        expect(entry.notBuilt).toBe(true);
      } else {
        expect(entry.on).toBe(true);
      }
    }
  });

  it.each(ALL_FAMILY_KEYS)('%s carries a full type package + palette + look/feel picks', (key) => {
    const f = FAMILIES[key];
    expect(f.typePackage.name.length).toBeGreaterThan(0);
    expect(f.typePackage.header).toBeTruthy();
    expect(f.typePackage.body).toBeTruthy();
    expect(f.typePackage.label).toBeTruthy();
    expect(f.typePackage.accent).toBeTruthy();
    expect(f.palette.bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(f.palette.fg).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(f.palette.muted).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(f.palette.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(f.texture.length).toBeGreaterThan(0);
    expect(f.wallpaper.length).toBeGreaterThan(0);
    expect(f.imageryGrade.length).toBeGreaterThan(0);
    expect(f.fontHref).toMatch(/^https:\/\/fonts\.googleapis\.com\/css2\?/);
  });

  it.each(ALL_FAMILY_KEYS)('%s names a defaultSkin (the onboarding-time paint the family owns)', (key) => {
    const f = FAMILIES[key];
    expect(f.defaultSkin).toMatch(/^main-street-[a-z]+$/);
  });

  it('locks the opens-with lead per family (v2 stacks)', () => {
    expect(FAMILIES.cozy.sectionStack.find((e) => e.lead)?.section).toBe('founder');
    expect(FAMILIES.rustic.sectionStack.find((e) => e.lead)?.section).toBe('founder');
    expect(FAMILIES.dark.sectionStack.find((e) => e.lead)?.section).toBe('goods');
    expect(FAMILIES.luxury.sectionStack.find((e) => e.lead)?.section).toBe('collections');
    expect(FAMILIES.cheerful.sectionStack.find((e) => e.lead)?.section).toBe('marquee');
    expect(FAMILIES.modern.sectionStack.find((e) => e.lead)?.section).toBe('goods');
  });

  it('locks the section variant picks per family (defaults matrix)', () => {
    expect(FAMILIES.cozy.sectionDefaults).toMatchObject({
      hero: 'story',
      goods: 'procession',
      collections: 'cupboard',
      reviews: 'guestbook',
      founder: 'letter',
      nav: 'standard',
      findUs: 'poster',
    });
    expect(FAMILIES.rustic.sectionDefaults).toMatchObject({
      hero: 'stacked',
      goods: 'marquee',
      collections: 'crates',
      reviews: 'guestbook',
      founder: 'workbench',
      nav: 'standard',
      findUs: 'itinerary',
    });
    expect(FAMILIES.dark.sectionDefaults).toMatchObject({
      hero: 'floating-card',
      goods: 'slideshow',
      collections: 'portals',
      reviews: 'pull-quote',
      founder: 'portrait',
      nav: 'menu-reveal',
      findUs: 'next-stop',
    });
    expect(FAMILIES.luxury.sectionDefaults).toMatchObject({
      hero: 'typographic',
      goods: 'switcher',
      collections: 'chapters',
      reviews: 'pull-quote',
      founder: 'editorial',
      nav: 'split-center',
      findUs: 'board',
    });
    expect(FAMILIES.cheerful.sectionDefaults).toMatchObject({
      hero: 'collage',
      goods: 'table',
      collections: 'lanes',
      reviews: 'texts',
      founder: 'card',
      nav: 'cta-forward',
      findUs: 'passes',
    });
    expect(FAMILIES.modern.sectionDefaults).toMatchObject({
      hero: 'split',
      goods: 'module',
      collections: 'cascade',
      reviews: 'rating',
      founder: 'signature',
      nav: 'split-center',
      findUs: 'calendar',
    });
  });
});

describe('getFamily', () => {
  it('resolves every current MoodKey to a family', () => {
    expect(getFamily('cozy').key).toBe('cozy');
    expect(getFamily('rustic').key).toBe('rustic');
    expect(getFamily('dark').key).toBe('dark');
    expect(getFamily('cheerful').key).toBe('cheerful');
    expect(getFamily('modern').key).toBe('modern');
  });

  it('maps the public "elegant" mood to the internal Luxury family', () => {
    expect(getFamily('elegant').key).toBe('luxury');
  });

  it('maps the retired "industrial" mood to Modern (nearest shelf neighbor)', () => {
    // No tenants currently carry industrial; this is the defensive fallback
    // until a follow-up migration drops it from MoodKey.
    expect(getFamily('industrial').key).toBe('modern');
  });

  it('falls back to Cozy for missing / unknown mood values', () => {
    expect(getFamily(null).key).toBe('cozy');
    expect(getFamily(undefined).key).toBe('cozy');
    expect(getFamily('').key).toBe('cozy');
    expect(getFamily('does-not-exist').key).toBe('cozy');
  });
});
