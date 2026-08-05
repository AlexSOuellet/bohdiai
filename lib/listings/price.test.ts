import { describe, it, expect } from 'vitest';
import { parsePriceToCents, formatCents } from './price';

describe('parsePriceToCents', () => {
  it('parses plain, dollar-signed, decimal, and comma-grouped prices', () => {
    expect(parsePriceToCents('24')).toBe(2400);
    expect(parsePriceToCents('$24')).toBe(2400);
    expect(parsePriceToCents('24.50')).toBe(2450);
    expect(parsePriceToCents('$1,200')).toBe(120000);
    expect(parsePriceToCents(' $24.99 ')).toBe(2499);
  });

  it('returns null for blank, zero, negative, or non-numeric input', () => {
    expect(parsePriceToCents('')).toBeNull();
    expect(parsePriceToCents('   ')).toBeNull();
    expect(parsePriceToCents('$0')).toBeNull();
    expect(parsePriceToCents('-5')).toBeNull();
    expect(parsePriceToCents('free')).toBeNull();
  });
});

describe('formatCents', () => {
  it('drops .00 for whole dollars, keeps cents otherwise', () => {
    expect(formatCents(2400)).toBe('$24');
    expect(formatCents(2450)).toBe('$24.50');
  });
});
