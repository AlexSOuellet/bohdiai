import { describe, it, expect } from 'vitest';
import { mainStreetArchetype } from './index';
import { MAIN_STREET_SKINS } from './skins';

describe('mainStreetArchetype', () => {
  it('exposes meta, schemas, and the skin shelf', () => {
    expect(mainStreetArchetype.meta.key).toBe('main-street');
    expect(Object.keys(mainStreetArchetype.themes).length).toBeGreaterThanOrEqual(1);
  });

  it('no longer ships the rejected arrangements', () => {
    expect(mainStreetArchetype.arrangements).toBeUndefined();
  });

  it('resolveTheme returns the matching skin', () => {
    const key = Object.keys(MAIN_STREET_SKINS)[0]!;
    expect(mainStreetArchetype.resolveTheme({ skinKey: key }).key).toBe(key);
  });

  it('resolveTheme throws on an unknown key', () => {
    expect(() => mainStreetArchetype.resolveTheme({ skinKey: 'nope' })).toThrow();
  });
});
