/**
 * The treatment roll — code supplies the dice, Bohdi reads them. These tests pin
 * the dice down: a roll is a uniform pick over a treatment set, deterministic for
 * a given random source so the pipeline can be tested and so the same number
 * always lands on the same face.
 */
import { describe, it, expect } from 'vitest';
import { GOODS_TREATMENTS } from '@/lib/archetypes/main-street/goods';
import { FOUNDER_TREATMENTS } from '@/lib/archetypes/main-street/schemas';
import { rollTreatment, rollTreatments } from './treatment-roll';

describe('rollTreatment', () => {
  const opts = ['a', 'b', 'c', 'd'] as const;

  it('returns the first option when the roll is 0', () => {
    expect(rollTreatment(opts, () => 0)).toBe('a');
  });

  it('returns the last option when the roll is just under 1', () => {
    expect(rollTreatment(opts, () => 0.999)).toBe('d');
  });

  it('maps a mid-range roll to the right face', () => {
    // floor(0.5 * 4) = 2 → third option
    expect(rollTreatment(opts, () => 0.5)).toBe('c');
  });

  it('never indexes past the end even if the source returns 1', () => {
    expect(rollTreatment(opts, () => 1)).toBe('d');
  });
});

describe('rollTreatments', () => {
  it('rolls a goods and a founder treatment from the real sets', () => {
    const rolled = rollTreatments(() => 0);
    expect(rolled.goods).toBe(GOODS_TREATMENTS[0]);
    expect(rolled.founder).toBe(FOUNDER_TREATMENTS[0]);
  });

  it('draws goods and founder independently, in that order', () => {
    // First call feeds the goods roll, second feeds the founder roll.
    const sequence = [0.999, 0];
    let i = 0;
    const rolled = rollTreatments(() => sequence[i++]!);
    expect(rolled.goods).toBe(GOODS_TREATMENTS[GOODS_TREATMENTS.length - 1]);
    expect(rolled.founder).toBe(FOUNDER_TREATMENTS[0]);
  });
});
