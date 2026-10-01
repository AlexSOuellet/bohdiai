import { describe, it, expect } from 'vitest';
import { combinationsOf, combinationKey, MAX_COMBINATIONS, MAX_OPTIONS, MAX_CHOICES } from './combinations';

describe('combinationsOf', () => {
  it('is empty when there are no options', () => {
    expect(combinationsOf([])).toEqual([]);
  });
  it('lists one combination per choice for a single option', () => {
    expect(combinationsOf([{ name: 'Size', choices: ['S', 'M'] }])).toEqual([{ Size: 'S' }, { Size: 'M' }]);
  });
  it('crosses every option, first option slowest', () => {
    expect(combinationsOf([{ name: 'Size', choices: ['S', 'M'] }, { name: 'Scent', choices: ['Fig', 'Pine'] }])).toEqual([
      { Size: 'S', Scent: 'Fig' },
      { Size: 'S', Scent: 'Pine' },
      { Size: 'M', Scent: 'Fig' },
      { Size: 'M', Scent: 'Pine' },
    ]);
  });
  it('is empty when any option has no choices yet', () => {
    expect(combinationsOf([{ name: 'Size', choices: ['S'] }, { name: 'Scent', choices: [] }])).toEqual([]);
  });
});

describe('combinationKey', () => {
  it('is the same whatever order the keys were written in', () => {
    expect(combinationKey({ Size: 'S', Scent: 'Fig' })).toBe(combinationKey({ Scent: 'Fig', Size: 'S' }));
  });
  it('differs for different choices', () => {
    expect(combinationKey({ Size: 'S' })).not.toBe(combinationKey({ Size: 'M' }));
  });
});

describe('limits', () => {
  it('are the plan’s numbers', () => {
    expect([MAX_OPTIONS, MAX_CHOICES, MAX_COMBINATIONS]).toEqual([3, 30, 100]);
  });
});
