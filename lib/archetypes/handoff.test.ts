import { describe, it, expect } from 'vitest';
import { MAIN_STREET_SPEC } from './main-street/builder';

describe('Main Street.handOff', () => {
  it('exposes handOff', () => {
    expect(typeof MAIN_STREET_SPEC.handOff).toBe('function');
  });
});
