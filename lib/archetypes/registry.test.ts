import { describe, it, expect } from 'vitest';
import { archetypeSpec, archetypeMenu } from './registry';

describe('archetype registry', () => {
  it('offers exactly one archetype — Main Street', () => {
    const menu = archetypeMenu();
    expect(menu.map((s) => s.key)).toEqual(['main-street']);
  });

  it('no longer resolves the Gallery archetype', () => {
    expect(archetypeSpec('gallery')).toBeUndefined();
  });

  it('still resolves Main Street', () => {
    expect(archetypeSpec('main-street')?.key).toBe('main-street');
  });

  it('renders the hand-built contractor layout but never offers it to Bohdi', () => {
    expect(archetypeSpec('contractor')?.key).toBe('contractor');
    expect(archetypeMenu().some((s) => s.key === 'contractor')).toBe(false);
  });
});
