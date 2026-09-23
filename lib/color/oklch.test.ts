import { describe, it, expect } from 'vitest';
import { hexToOklch, oklchToHex, deltaE, hexToRgba } from './oklch';

describe('oklch', () => {
  it('maps white and black to the ends of lightness', () => {
    expect(hexToOklch('#ffffff').l).toBeCloseTo(1, 3);
    expect(hexToOklch('#000000').l).toBeCloseTo(0, 3);
    expect(hexToOklch('#ffffff').c).toBeLessThan(0.001);
  });

  it('round-trips every sampled sRGB color to the same hex', () => {
    for (let r = 0; r < 256; r += 51) for (let g = 0; g < 256; g += 51) for (let b = 0; b < 256; b += 51) {
      const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
      expect(oklchToHex(hexToOklch(hex))).toBe(hex);
    }
  });

  it('clamps out-of-gamut chroma instead of producing garbage', () => {
    const hex = oklchToHex({ l: 0.9, c: 0.4, h: 140 });
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('measures zero distance for identical colors and more for different ones', () => {
    expect(deltaE('#3dae3f', '#3dae3f')).toBe(0);
    expect(deltaE('#000000', '#ffffff')).toBeCloseTo(1, 2);
  });

  it('formats rgba from hex', () => {
    expect(hexToRgba('#ffffff', 0.18)).toBe('rgba(255, 255, 255, 0.18)');
  });
});
