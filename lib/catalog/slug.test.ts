import { describe, it, expect } from 'vitest';
import { slugify, uniqueSlug, slugLookupPrefix } from './slug';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Fig & Cedar Candle')).toBe('fig-cedar-candle');
  });
  it('drops accents and stray punctuation', () => {
    expect(slugify('  Crème Brûlée!! ')).toBe('creme-brulee');
  });
  it('spells out letters that have no accent to strip', () => {
    expect(slugify('Ørsted Æble straße')).toBe('orsted-aeble-strasse');
    expect(slugify('Œuvre Łódź Đak Þór Ðað')).toBe('oeuvre-lodz-dak-thor-dad');
  });
  it('never returns an empty slug', () => {
    expect(slugify('!!!')).toBe('item');
  });
  it('caps the length without a trailing hyphen', () => {
    const s = slugify('a'.repeat(50) + ' ' + 'b'.repeat(50));
    expect(s.length).toBeLessThanOrEqual(60);
    expect(s.endsWith('-')).toBe(false);
  });
});

describe('uniqueSlug', () => {
  it('keeps the slug when it is free', () => {
    expect(uniqueSlug('candle', new Set())).toBe('candle');
  });
  it('adds the first free number, ignoring case', () => {
    expect(uniqueSlug('candle', new Set(['Candle', 'candle-2']))).toBe('candle-3');
  });
  it('lowercases the base too', () => {
    expect(uniqueSlug('Candle', new Set(['candle']))).toBe('candle-2');
  });
  it('stays within 60 characters when a number is added', () => {
    const long = 'a'.repeat(57) + '-bc';
    const s = uniqueSlug(long, new Set([long]));
    expect(s.length).toBeLessThanOrEqual(60);
    expect(s.endsWith('-2')).toBe(true);
    expect(s).not.toContain('--');
  });
});

describe('slugLookupPrefix', () => {
  it('is a prefix of every numbered web address uniqueSlug can make', () => {
    const long = 'a'.repeat(57) + '-bc';
    const prefix = slugLookupPrefix(long);
    const taken = new Set([long]);
    for (let n = 0; n < 12; n++) {
      const next = uniqueSlug(long, taken);
      expect(next.startsWith(prefix)).toBe(true);
      taken.add(next);
    }
    expect(slugLookupPrefix('candle')).toBe('candle');
  });
});
