import { describe, it, expect } from 'vitest';
import {
  COMPARISON,
  COMPARISON_CHECKED,
  PLANS,
  PLAN_IDS,
  formatPrice,
  fromPrice,
  isPlanId,
  planById,
  plansFor,
} from './plans';

describe('plans', () => {
  it('has the five agreed plans at the agreed whole-dollar prices', () => {
    expect(PLANS.map((p) => [p.id, p.monthly, p.yearly])).toEqual([
      ['maker-showcase', 5, 50],
      ['maker-lite', 15, 150],
      ['maker-full', 20, 200],
      ['contractor-lite', 15, 150],
      ['contractor-full', 30, 300],
    ]);
    for (const p of PLANS) expect(Number.isInteger(p.monthly)).toBe(true);
  });

  it('prices every year at two months free', () => {
    for (const p of PLANS) expect(p.yearly).toBe(p.monthly * 10);
  });

  it('starts makers at Showcase and contractors at Lite', () => {
    expect(fromPrice('maker')).toBe(5);
    expect(fromPrice('contractor')).toBe(15);
  });

  it('gives each audience its plans in order, and only its own plans', () => {
    expect(plansFor('maker').map((p) => p.id)).toEqual(['maker-showcase', 'maker-lite', 'maker-full']);
    expect(plansFor('contractor').map((p) => p.id)).toEqual(['contractor-lite', 'contractor-full']);
  });

  it('describes every plan with something to include', () => {
    for (const p of PLANS) {
      expect(p.name).not.toBe('');
      expect(p.forWho).not.toBe('');
      expect(p.includes.length).toBeGreaterThan(2);
    }
  });

  it('recognises plan ids and nothing else', () => {
    expect(PLAN_IDS).toHaveLength(5);
    expect(isPlanId('maker-full')).toBe(true);
    expect(isPlanId('maker-pro')).toBe(false);
    expect(isPlanId('')).toBe(false);
    expect(planById('contractor-lite').name).toBe('Contractor Lite');
  });

  it('ends every comparison with BohdiAI and fills every row', () => {
    for (const rows of Object.values(COMPARISON)) {
      expect(rows.at(-1)?.ours).toBe(true);
      expect(rows.filter((r) => r.ours === true)).toHaveLength(1);
      for (const r of rows) {
        expect(r.name).not.toBe('');
        expect(r.cost).not.toBe('');
        expect(r.you).not.toBe('');
      }
    }
  });

  it('names Etsy for makers and the lead services for contractors', () => {
    expect(COMPARISON.maker.map((r) => r.name).join(' ')).toMatch(/Etsy/);
    expect(COMPARISON.contractor.map((r) => r.name).join(' ')).toMatch(/Angi/);
  });

  it('records when the competitor prices were checked', () => {
    expect(COMPARISON_CHECKED).toBe('2026-10-02');
  });

  it('formats prices the way the page shows them', () => {
    expect(formatPrice(15)).toBe('$15');
    expect(formatPrice(4.5)).toBe('$4.50');
  });
});
