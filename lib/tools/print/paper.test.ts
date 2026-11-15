import { describe, it, expect } from 'vitest';
import { crc32, withDpi } from './png';
import { brighten, whiteBounds } from './pixels';
import { cornerMarks, footerLine, overlapTicks, rulerBar } from './marks';
import type { Sheet, SheetItem } from './layout';

/** The smallest real PNG: signature + IHDR (1 × 1) + IDAT + IEND. */
const PNG = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='),
  (c) => c.charCodeAt(0),
);

describe('withDpi', () => {
  it('writes the print size into the PNG right after its header', () => {
    const out = withDpi(PNG, 300);
    expect(out.length).toBe(PNG.length + 21);
    const at = 33;
    const view = new DataView(out.buffer);
    expect(view.getUint32(at)).toBe(9);
    expect(String.fromCharCode(...out.subarray(at + 4, at + 8))).toBe('pHYs');
    expect(view.getUint32(at + 8)).toBe(11811);
    expect(view.getUint32(at + 12)).toBe(11811);
    expect(out[at + 16]).toBe(1);
    expect(view.getUint32(at + 17)).toBe(crc32(out.subarray(at + 4, at + 17)));
    expect(out.subarray(0, 33)).toEqual(PNG.subarray(0, 33));
    expect(out.subarray(54)).toEqual(PNG.subarray(33));
  });
  it('checks with the standard CRC', () => {
    expect(crc32(new TextEncoder().encode('IEND'))).toBe(0xae426082);
  });
});

describe('whiteBounds', () => {
  const img = (w: number, h: number, dark: Array<[number, number]>): Uint8ClampedArray => {
    const d = new Uint8ClampedArray(w * h * 4).fill(255);
    for (const [x, y] of dark) d.fill(20, (y * w + x) * 4, (y * w + x) * 4 + 3);
    return d;
  };
  it('finds the art inside a white border', () => {
    expect(whiteBounds(img(10, 8, [[2, 3], [6, 5]]), 10, 8)).toEqual({ x0: 2, y0: 3, x1: 7, y1: 6 });
  });
  it('gives null for a blank page', () => {
    expect(whiteBounds(img(4, 4, []), 4, 4)).toBeNull();
  });
});

describe('brighten', () => {
  it('lifts the colour for thin paper and leaves white white', () => {
    const d = new Uint8ClampedArray([255, 255, 255, 255, 120, 80, 60, 255, 0, 0, 0, 255]);
    brighten(d);
    expect(Array.from(d.subarray(0, 4))).toEqual([255, 255, 255, 255]);
    const [r = 0, g = 0, b = 0, a] = d.subarray(4, 8);
    expect(a).toBe(255);
    expect(r).toBeGreaterThan(120);
    expect(r - b).toBeGreaterThan(60);
    expect(g).toBeGreaterThan(80);
    // Black lines stay dark.
    expect(Math.max(...d.subarray(8, 11))).toBeLessThan(10);
  });
});

const item = (over: Partial<SheetItem> = {}): SheetItem => ({ design: 0, x0: 0, y0: 0, w: 8, h: 8, px: 0.25, py: 1.5, nextX: null, nextY: null, ...over });

describe('marks', () => {
  it('puts a pair of marks at every corner, clear of the print', () => {
    const lines = cornerMarks(item(), 0.25);
    expect(lines).toHaveLength(8);
    for (const l of lines) {
      const inside = (x: number, y: number): boolean => x > 0.25 + 1e-9 && x < 8.25 - 1e-9 && y > 1.5 + 1e-9 && y < 9.5 - 1e-9;
      expect(inside(l.x1, l.y1) || inside(l.x2, l.y2)).toBe(false);
    }
  });
  it('keeps marks short where prints share a sheet, and leaves them off with no room', () => {
    const lines = cornerMarks(item(), 0.125);
    for (const l of lines) expect(Math.hypot(l.x2 - l.x1, l.y2 - l.y1)).toBeLessThanOrEqual(0.125);
    expect(cornerMarks(item(), 0.05)).toEqual([]);
  });
  it('ticks where the next sheet’s part starts', () => {
    const ticks = overlapTicks(item({ px: 0.25, py: 0.25, w: 8, h: 10.5, nextX: 7.75, nextY: 10.25 }));
    expect(ticks).toHaveLength(4);
    expect(ticks.filter((t) => t.x1 === 8 && t.x2 === 8)).toHaveLength(2);
    expect(ticks.filter((t) => t.y1 === 10.5 && t.y2 === 10.5)).toHaveLength(2);
    expect(overlapTicks(item())).toEqual([]);
  });
  it('says how to print along the bottom, with a ruler bar', () => {
    const sheet: Sheet = { pw: 8.5, ph: 11, items: [item()] };
    expect(footerLine(sheet, 0, 1, '8 × 8 in')).toEqual({ text: '8 × 8 in · print at 100% / Actual size', y: 10.89 });
    const tiled: Sheet = { pw: 8.5, ph: 11, items: [item({ py: 0.25, h: 10.5 })] };
    expect(footerLine(tiled, 2, 6, '16 × 20 in')?.text).toBe('Sheet 3 of 6 · print at 100% / Actual size');
    expect(footerLine({ pw: 8, ph: 8, items: [item({ px: 0, py: 0 })] }, 0, 1, '8 × 8 in')).toBeNull();
    expect(rulerBar(8.5, 'in')).toMatchObject({ x2: 8.2, label: '1 in' });
    expect(rulerBar(8.5, 'in').x1).toBeCloseTo(7.2, 9);
    expect(rulerBar(8.5, 'cm').x2 - rulerBar(8.5, 'cm').x1).toBeCloseTo(2 / 2.54, 9);
    expect(rulerBar(8.5, 'cm').label).toBe('2 cm');
  });
});
