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
    const big = Array.from({ length: 40 }, (_, i) => ({ i, onHome: false }));
    expect(sampleForTreatment(big, 'module')).toHaveLength(GOODS_SAMPLE_CAP.module);
  });
});

describe('goods treatments — table / index / lookbook registration', () => {
  it('registers the table, index and lookbook treatments', () => {
    expect(GOODS_TREATMENTS).toContain('table');
    expect(GOODS_TREATMENTS).toContain('index');
    expect(GOODS_TREATMENTS).toContain('lookbook');
  });

  it('does NOT carry the retired carousel treatment (it rhymed with the marquee)', () => {
    expect(GOODS_TREATMENTS).not.toContain('carousel');
  });

  it('gives each a sample cap and an authoring-menu line', () => {
    for (const t of ['table', 'index', 'lookbook'] as const) {
      expect(GOODS_SAMPLE_CAP[t]).toBeGreaterThan(0);
      expect(GOODS_TREATMENT_MENU[t]).toBeTruthy();
    }
  });

  it('caps each home sampling to its cap', () => {
    const big = Array.from({ length: 40 }, (_, i) => ({ i, onHome: false }));
    expect(sampleForTreatment(big, 'table')).toHaveLength(GOODS_SAMPLE_CAP.table);
    expect(sampleForTreatment(big, 'index')).toHaveLength(GOODS_SAMPLE_CAP.index);
    expect(sampleForTreatment(big, 'lookbook')).toHaveLength(GOODS_SAMPLE_CAP.lookbook);
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
  const big = Array.from({ length: 40 }, (_, i) => ({ i, onHome: false }));

  it('caps the home sampling to the treatment cap', () => {
    expect(sampleForTreatment(big, 'marquee')).toHaveLength(GOODS_SAMPLE_CAP.marquee);
    expect(sampleForTreatment(big, 'procession')).toHaveLength(GOODS_SAMPLE_CAP.procession);
    expect(sampleForTreatment(big, 'switcher')).toHaveLength(GOODS_SAMPLE_CAP.switcher);
  });

  it('returns everything when the catalog is smaller than the cap', () => {
    expect(sampleForTreatment([{ onHome: false }, { onHome: false }], 'marquee')).toHaveLength(2);
  });

  it('keeps the procession short (it is full-width rows)', () => {
    expect(GOODS_SAMPLE_CAP.procession).toBeLessThan(GOODS_SAMPLE_CAP.marquee);
  });
});

describe('sampleForTreatment — the owner’s home picks', () => {
  const item = (i: number, onHome = false) => ({ i, onHome });

  it('shows only the products the owner put on the home page, in catalog order', () => {
    const products = [item(0), item(1, true), item(2), item(3, true), item(4)];
    expect(sampleForTreatment(products, 'marquee')).toEqual([item(1, true), item(3, true)]);
  });

  it('caps the owner’s picks by the treatment', () => {
    const products = Array.from({ length: 8 }, (_, i) => item(i, true));
    expect(sampleForTreatment(products, 'lookbook')).toHaveLength(GOODS_SAMPLE_CAP.lookbook);
  });

  it('never shows more than 5 owner picks, even where the treatment allows more', () => {
    const products = Array.from({ length: 8 }, (_, i) => item(i, true));
    expect(sampleForTreatment(products, 'marquee')).toEqual(products.slice(0, 5));
  });

  it('takes the first products as before when the owner picked none', () => {
    const products = Array.from({ length: 40 }, (_, i) => item(i));
    expect(sampleForTreatment(products, 'switcher')).toEqual(products.slice(0, GOODS_SAMPLE_CAP.switcher));
  });
});
