import { describe, it, expect } from 'vitest';
import { slugify, uniqueSlug } from './slug';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Fig & Cedar Candle')).toBe('fig-cedar-candle');
  });
  it('drops accents and stray punctuation', () => {
    expect(slugify('  Crème Brûlée!! ')).toBe('creme-brulee');
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
});
