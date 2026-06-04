import { describe, it, expect } from 'vitest';
import { selectGoodsTreatment, sampleForTreatment, GOODS_SAMPLE_CAP } from './goods';

describe('selectGoodsTreatment', () => {
  it('gives a deep catalog the marquee', () => {
    expect(selectGoodsTreatment(12)).toBe('marquee');
    expect(selectGoodsTreatment(40)).toBe('marquee');
  });

  it('gives a mid catalog the procession', () => {
    expect(selectGoodsTreatment(6)).toBe('procession');
    expect(selectGoodsTreatment(11)).toBe('procession');
  });

  it('gives a small catalog the switcher by default', () => {
    expect(selectGoodsTreatment(3)).toBe('switcher');
    expect(selectGoodsTreatment(5, 'modern')).toBe('switcher');
    expect(selectGoodsTreatment(2, 'simple')).toBe('switcher');
  });

  it('gives a small cinematic-mood catalog the slideshow', () => {
    expect(selectGoodsTreatment(4, 'cozy')).toBe('slideshow');
    expect(selectGoodsTreatment(3, 'DARK')).toBe('slideshow');
    expect(selectGoodsTreatment(5, 'dark sunset')).toBe('slideshow');
  });

  it('is deterministic for the same inputs', () => {
    expect(selectGoodsTreatment(4, 'rustic')).toBe(selectGoodsTreatment(4, 'rustic'));
  });
});

describe('sampleForTreatment', () => {
  const big = Array.from({ length: 40 }, (_, i) => i);

  it('caps the home sampling to the treatment cap', () => {
    expect(sampleForTreatment(big, 'marquee')).toHaveLength(GOODS_SAMPLE_CAP.marquee);
    expect(sampleForTreatment(big, 'procession')).toHaveLength(GOODS_SAMPLE_CAP.procession);
    expect(sampleForTreatment(big, 'switcher')).toHaveLength(GOODS_SAMPLE_CAP.switcher);
  });

  it('returns everything when the catalog is smaller than the cap', () => {
    expect(sampleForTreatment([1, 2], 'marquee')).toEqual([1, 2]);
  });

  it('keeps the procession short (it is full-width rows)', () => {
    expect(GOODS_SAMPLE_CAP.procession).toBeLessThan(GOODS_SAMPLE_CAP.marquee);
  });
});
