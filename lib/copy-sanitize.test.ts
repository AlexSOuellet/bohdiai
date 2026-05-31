import { describe, it, expect } from 'vitest';
import { sanitizeCopy, sanitizeDeep } from './copy-sanitize';

describe('sanitizeCopy', () => {
  it('returns empty string unchanged', () => {
    expect(sanitizeCopy('')).toBe('');
  });

  it('replaces em-dash with period and capitalizes next word', () => {
    expect(sanitizeCopy('Hello — world is great')).toBe('Hello. World is great');
  });

  it('replaces en-dash with period and capitalizes', () => {
    expect(sanitizeCopy('Hello – world')).toBe('Hello. World');
  });

  it('replaces tight em-dash without spaces', () => {
    expect(sanitizeCopy('one—two')).toBe('one. Two');
  });

  it('replaces semicolon with period and capitalizes', () => {
    expect(sanitizeCopy('first; second clause')).toBe('first. Second clause');
  });

  it('strips parentheticals while keeping content', () => {
    expect(sanitizeCopy('Bread (made fresh) daily.')).toBe('Bread made fresh daily.');
  });

  it('collapses double spaces', () => {
    expect(sanitizeCopy('a  b   c')).toBe('a b c');
  });

  it('does not capitalize when next character is already uppercase', () => {
    expect(sanitizeCopy('Hello — World')).toBe('Hello. World');
  });

  it('trims trailing whitespace', () => {
    expect(sanitizeCopy('Done.   ')).toBe('Done.');
  });

  it('handles multiple substitutions in one string', () => {
    expect(sanitizeCopy('a — b; c (note) d')).toBe('a. B. C note d');
  });

  it('leaves clean copy alone (aside from initial capitalization where applicable)', () => {
    expect(sanitizeCopy('Just a normal sentence.')).toBe('Just a normal sentence.');
  });
});

describe('sanitizeDeep', () => {
  it('sanitizes a bare string', () => {
    expect(sanitizeDeep('a — b')).toBe('a. B');
  });

  it('passes through numbers', () => {
    expect(sanitizeDeep(42)).toBe(42);
  });

  it('passes through booleans', () => {
    expect(sanitizeDeep(true)).toBe(true);
  });

  it('passes through null', () => {
    expect(sanitizeDeep(null)).toBe(null);
  });

  it('passes through undefined', () => {
    expect(sanitizeDeep(undefined)).toBe(undefined);
  });

  it('recursively sanitizes arrays', () => {
    expect(sanitizeDeep(['a — b', 'c; d'])).toEqual(['a. B', 'c. D']);
  });

  it('recursively sanitizes nested objects', () => {
    expect(sanitizeDeep({ title: 'one — two', meta: { description: 'a; b', count: 3 } })).toEqual({
      title: 'one. Two',
      meta: { description: 'a. B', count: 3 },
    });
  });

  it('does not mutate the input object', () => {
    const input = { a: 'x — y' };
    const out = sanitizeDeep(input);
    expect(input.a).toBe('x — y');
    expect(out.a).toBe('x. Y');
  });

  it('handles array of objects', () => {
    expect(sanitizeDeep([{ s: 'a; b' }])).toEqual([{ s: 'a. B' }]);
  });
});
