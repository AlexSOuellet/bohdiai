import { describe, it, expect } from 'vitest';
import { paintPrint } from './draw';

/** A canvas context that records the calls made on it. */
function recorder(): { ctx: CanvasRenderingContext2D; calls: string[] } {
  const calls: string[] = [];
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (_t, prop) => (...args: unknown[]) => {
      calls.push(`${String(prop)}(${args.filter((a) => typeof a === 'number').join(',')})`);
    },
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}

const src = { width: 1000, height: 2000 } as HTMLCanvasElement;
const look = { mirror: false, brighter: false };

describe('paintPrint', () => {
  it('shows a round piece round: the picture is clipped to the circle (Alex, 2026-11-15)', () => {
    const { ctx, calls } = recorder();
    paintPrint(ctx, src, { w: 4, h: 4 }, look, { shape: 'round', wrapIn: 0 }, 100);
    const drawn = calls.indexOf(calls.find((c) => c.startsWith('drawImage')) ?? '');
    const clips = calls.slice(0, drawn).filter((c) => c.startsWith('clip'));
    expect(clips).toHaveLength(2);
    expect(calls.slice(0, drawn).some((c) => c.startsWith('ellipse(2,2,2,2'))).toBe(true);
  });
  it('leaves a rectangle square', () => {
    const { ctx, calls } = recorder();
    paintPrint(ctx, src, { w: 4, h: 4 }, look, { shape: 'rect', wrapIn: 0 }, 100);
    const drawn = calls.indexOf(calls.find((c) => c.startsWith('drawImage')) ?? '');
    expect(calls.slice(0, drawn).filter((c) => c.startsWith('clip'))).toHaveLength(1);
    expect(calls.some((c) => c.startsWith('ellipse'))).toBe(false);
  });
});

describe('extending the design to fill the space (Alex, 2026-11-15)', () => {
  const draws = (calls: string[]): number => calls.filter((c) => c.startsWith('drawImage')).length;
  it('mirrors the design outward when it’s zoomed out, so there’s no white', () => {
    const { ctx, calls } = recorder();
    // A tall design zoomed out in a square: space either side.
    paintPrint(ctx, src, { w: 4, h: 4 }, { ...look, frame: { zoom: 0.5, x: 0, y: 0 }, extend: true }, { shape: 'rect', wrapIn: 0 }, 100);
    expect(draws(calls)).toBe(3);
    expect(calls.filter((c) => c === 'scale(-1,1)').length).toBeGreaterThanOrEqual(2);
  });
  it('draws it once when it already fills the print, or when not asked', () => {
    const a = recorder();
    paintPrint(a.ctx, src, { w: 4, h: 4 }, { ...look, extend: true }, { shape: 'rect', wrapIn: 0 }, 100);
    expect(draws(a.calls)).toBe(1);
    const b = recorder();
    paintPrint(b.ctx, src, { w: 4, h: 4 }, { ...look, frame: { zoom: 0.5, x: 0, y: 0 } }, { shape: 'rect', wrapIn: 0 }, 100);
    expect(draws(b.calls)).toBe(1);
  });
});
