import { describe, it, expect } from 'vitest';
import {
  COMPARISON,
  COMPARISON_CHECKED,
  PLANS,
  PLAN_IDS,
  formatPrice,
  isPlanId,
  planById,
  plansFor,
} from './plans';

describe('plans', () => {
  it('has the four agreed plans at the agreed prices', () => {
    expect(PLANS.map((p) => [p.id, p.monthly, p.yearly])).toEqual([
      ['maker-lite', 14.99, 149],
      ['maker-full', 19.99, 199],
      ['contractor-lite', 14.99, 149],
      ['contractor-full', 29.99, 299],
    ]);
  });

  it('prices every year at about two months free', () => {
    for (const p of PLANS) expect(p.yearly).toBe(Math.floor(p.monthly * 10));
  });

  it('gives each audience Lite then Full, and only its own plans', () => {
    expect(plansFor('maker').map((p) => p.id)).toEqual(['maker-lite', 'maker-full']);
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
    expect(PLAN_IDS).toHaveLength(4);
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
    expect(formatPrice(14.99)).toBe('$14.99');
    expect(formatPrice(149)).toBe('$149');
  });
});
