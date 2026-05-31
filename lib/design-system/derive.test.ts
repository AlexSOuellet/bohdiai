import { describe, it, expect } from 'vitest';
import { deriveSemanticColors } from './derive';

describe('deriveSemanticColors', () => {
  it('returns hex strings for all semantic color roles', () => {
    const colors = deriveSemanticColors('#6B3F2A', 'light');
    const hexPattern = /^#[0-9a-f]{6}$/i;
    expect(colors.surface).toMatch(hexPattern);
    expect(colors.onSurface).toMatch(hexPattern);
    expect(colors.surfaceVariant).toMatch(hexPattern);
    expect(colors.onSurfaceVariant).toMatch(hexPattern);
    expect(colors.primary).toMatch(hexPattern);
    expect(colors.onPrimary).toMatch(hexPattern);
    expect(colors.primaryContainer).toMatch(hexPattern);
    expect(colors.onPrimaryContainer).toMatch(hexPattern);
    expect(colors.secondary).toMatch(hexPattern);
    expect(colors.onSecondary).toMatch(hexPattern);
    expect(colors.secondaryContainer).toMatch(hexPattern);
    expect(colors.onSecondaryContainer).toMatch(hexPattern);
    expect(colors.outline).toMatch(hexPattern);
    expect(colors.inverseSurface).toMatch(hexPattern);
    expect(colors.inverseOnSurface).toMatch(hexPattern);
  });

  it('light scheme produces a light surface', () => {
    const colors = deriveSemanticColors('#6B3F2A', 'light');
    // Light scheme surface should be near-white — red channel > 200
    const r = parseInt(colors.surface.slice(1, 3), 16);
    expect(r).toBeGreaterThan(200);
  });

  it('dark scheme produces a dark surface', () => {
    const colors = deriveSemanticColors('#6B3F2A', 'dark');
    // Dark scheme surface should be near-black — red channel < 50
    const surfaceR = parseInt(colors.surface.slice(1, 3), 16);
    expect(surfaceR).toBeLessThan(50);
  });

  it('produces distinct results for different seed colors', () => {
    const warm = deriveSemanticColors('#8B4513', 'light');
    const cool = deriveSemanticColors('#1A3A5C', 'light');
    expect(warm.primary).not.toBe(cool.primary);
  });

  it('produces distinct results for light vs dark scheme', () => {
    const light = deriveSemanticColors('#6B3F2A', 'light');
    const dark = deriveSemanticColors('#6B3F2A', 'dark');
    expect(light.surface).not.toBe(dark.surface);
  });
});
