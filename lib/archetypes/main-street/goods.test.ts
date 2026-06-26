import { describe, it, expect } from 'vitest';
import {
  selectGoodsTreatment,
  sampleForTreatment,
  GOODS_SAMPLE_CAP,
  GOODS_TREATMENTS,
  GOODS_TREATMENT_MENU,
} from './goods';

describe('goods treatments — module registration', () => {
  it('registers the module treatment', () => {
    expect(GOODS_TREATMENTS).toContain('module');
  });

  it('gives module a sample cap and an authoring-menu line', () => {
    expect(GOODS_SAMPLE_CAP.module).toBeGreaterThan(0);
    expect(GOODS_TREATMENT_MENU.module).toBeTruthy();
  });

  it('caps the module home sampling to its cap', () => {
    const big = Array.from({ length: 40 }, (_, i) => i);
    expect(sampleForTreatment(big, 'module')).toHaveLength(GOODS_SAMPLE_CAP.module);
  });
});

describe('selectGoodsTreatment', () => {
  it('gives a deep catalog the marquee', () => {
    expect(selectGoodsTreatment(12)).toBe('marquee');
    expect(selectGoodsTreatment(40)).toBe('marquee');
  });

  it('gives a mid catalog the procession', () => {
    expect(selectGoodsTreatment(6)).toBe('procession');
    expect(selectGoodsTreatment(11)).toBe('procession');
  });

  it('gives a small catalog the switcher — never keyed off mood (no mood→treatment rule)', () => {
    expect(selectGoodsTreatment(3)).toBe('switcher');
    expect(selectGoodsTreatment(5)).toBe('switcher');
    expect(selectGoodsTreatment(2)).toBe('switcher');
  });

  it('is a pure size-based fallback, deterministic for the same count', () => {
    expect(selectGoodsTreatment(4)).toBe(selectGoodsTreatment(4));
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
