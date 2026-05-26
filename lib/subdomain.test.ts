import { describe, it, expect } from 'vitest';
import { toSubdomain } from './subdomain';

describe('toSubdomain', () => {
  it('lowercases the name', () => {
    expect(toSubdomain('FlameWorks')).toBe('flameworks');
  });

  it('replaces spaces with hyphens', () => {
    expect(toSubdomain('Flame Works Candle Co')).toBe('flame-works-candle-co');
  });

  it('collapses multiple spaces into one hyphen', () => {
    expect(toSubdomain('Flame  Works')).toBe('flame-works');
  });

  it('removes curly apostrophes', () => {
    expect(toSubdomain("Alex's Candles")).toBe('alexs-candles');
  });

  it('removes straight apostrophes', () => {
    expect(toSubdomain("Alex's Candles")).toBe('alexs-candles');
  });

  it('removes backtick apostrophes', () => {
    expect(toSubdomain('Alex`s Candles')).toBe('alexs-candles');
  });

  it('strips leading and trailing hyphens', () => {
    expect(toSubdomain('--Candles--')).toBe('candles');
  });

  it('replaces special characters with hyphens', () => {
    expect(toSubdomain('Flame & Forge')).toBe('flame-forge');
  });

  it('collapses consecutive special characters into one hyphen', () => {
    expect(toSubdomain('Flame & Co. Candles')).toBe('flame-co-candles');
  });

  it('truncates to 63 characters', () => {
    const long = 'a'.repeat(80);
    expect(toSubdomain(long)).toHaveLength(63);
  });

  it('handles a name that is exactly 63 characters', () => {
    const exact = 'a'.repeat(63);
    expect(toSubdomain(exact)).toBe(exact);
  });

  it('returns empty string for blank input', () => {
    expect(toSubdomain('')).toBe('');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(toSubdomain('   ')).toBe('');
  });

  it('handles numeric names', () => {
    expect(toSubdomain('42Candles')).toBe('42candles');
  });

  it('preserves existing hyphens', () => {
    expect(toSubdomain('hand-poured')).toBe('hand-poured');
  });

  it('handles unicode characters by replacing with hyphens', () => {
    expect(toSubdomain('Café Candles')).toBe('caf-candles');
  });
});
