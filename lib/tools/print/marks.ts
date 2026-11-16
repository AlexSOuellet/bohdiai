/** What Print it draws on each sheet besides the picture: corner marks to cut
 *  along, ticks where the next sheet's part starts, and the footer with a ruler bar
 *  to check the print came out true to size. All in inches on the page. */
import type { Sheet, SheetItem, Unit } from './layout';

export type Line = { x1: number; y1: number; x2: number; y2: number };

const GAP = 0.05;
const LEN = 0.16;
const TICK_NEAR = 0.04;
const TICK_FAR = 0.2;
const FOOTER_ROOM = 0.17;
const RULER_INSET = 0.3;
const r4 = (n: number): number => Math.round(n * 1e4) / 1e4;

/** A pair of marks at each corner, just outside the print. `room` is the clear space
 *  around the print; with too little there are none. */
export function cornerMarks(it: SheetItem, room: number): Line[] {
  if (room < GAP + 0.06) return [];
  const len = Math.min(LEN, room - GAP - 0.01);
  const x0 = it.px;
  const y0 = it.py;
  const x1 = it.px + it.w;
  const y1 = it.py + it.h;
  const out: Line[] = [];
  for (const [x, y, sx, sy] of [
    [x0, y0, -1, -1],
    [x1, y0, 1, -1],
    [x0, y1, -1, 1],
    [x1, y1, 1, 1],
  ] as const) {
    out.push({ x1: x + sx * GAP, y1: y, x2: x + sx * (GAP + len), y2: y });
    out.push({ x1: x, y1: y + sy * GAP, x2: x, y2: y + sy * (GAP + len) });
  }
  return out;
}

/** Ticks above and below (or either side) where the next sheet's art starts. */
export function overlapTicks(it: SheetItem): Line[] {
  const out: Line[] = [];
  const bottom = it.py + it.h;
  const right = it.px + it.w;
  if (it.nextX !== null) {
    const x = it.px + it.nextX;
    out.push({ x1: x, y1: it.py - TICK_FAR, x2: x, y2: it.py - TICK_NEAR }, { x1: x, y1: bottom + TICK_NEAR, x2: x, y2: bottom + TICK_FAR });
  }
  if (it.nextY !== null) {
    const y = it.py + it.nextY;
    out.push({ x1: it.px - TICK_FAR, y1: y, x2: it.px - TICK_NEAR, y2: y }, { x1: right + TICK_NEAR, y1: y, x2: right + TICK_FAR, y2: y });
  }
  return out;
}

/** The line along the bottom of a sheet, or null when there's no room for it. */
export function footerLine(sheet: Sheet, index: number, count: number, size: string): { text: string; y: number } | null {
  const lowest = Math.max(0, ...sheet.items.map((i) => i.py + i.h));
  const room = sheet.ph - lowest;
  if (room < FOOTER_ROOM) return null;
  const say = 'print at 100% / Actual size';
  return { text: count > 1 ? `Sheet ${index + 1} of ${count} · ${say}` : `${size} · ${say}`, y: r4(sheet.ph - Math.min(0.11, room / 2)) };
}

/** The ruler bar at the bottom right: 1 in, or 2 cm. */
export function rulerBar(pw: number, unit: Unit): { x1: number; x2: number; label: string } {
  const bar = unit === 'cm' ? 2 / 2.54 : 1;
  const x2 = r4(pw - RULER_INSET);
  return { x1: x2 - bar, x2, label: unit === 'cm' ? '2 cm' : '1 in' };
}
