import { describe, it, expect } from 'vitest';
import { DPI, FILL, FOOT_IN, GAP_IN, fillsSheet, type Sheet, MAX_AREA, MAX_IN, MAX_ZOOM, OVERLAP_IN, MARGIN_IN, PAPERS, biggestSharp, clampZoom, minZoom, nudge, enlargeFactor, fmtSize, parseSize, placement, planSheets, sourceDpi, withWrap } from './layout';

describe('parseSize and fmtSize', () => {
  it('reads inches and centimetres into inches', () => {
    expect(parseSize('8', 'in')).toBe(8);
    expect(parseSize(' 8.5 ', 'in')).toBe(8.5);
    expect(parseSize('.5', 'in')).toBe(0.5);
    expect(parseSize('20.3', 'cm')).toBeCloseTo(7.992, 3);
  });
  it.each(['', '0', '0.0', 'abc', '-3', '8in', '1e3'])('ignores %j', (t) => {
    expect(parseSize(t, 'in')).toBeNull();
  });
  it('caps a size at the most a print can be', () => {
    expect(parseSize('600', 'in')).toBe(MAX_IN);
    expect(MAX_IN).toBe(200);
  });
  it('shows sizes in the maker’s unit without trailing zeros', () => {
    expect(fmtSize(8, 'in')).toBe('8');
    expect(fmtSize(8.5, 'in')).toBe('8.5');
    expect(fmtSize(7.333333, 'in')).toBe('7.33');
    expect(fmtSize(7.992, 'cm')).toBe('20.3');
    expect(fmtSize(8, 'cm')).toBe('20.3');
    expect(fmtSize(10 / 2.54, 'cm')).toBe('10');
  });
  it('a size saved in inches shows back the centimetres the maker typed', () => {
    const inches = parseSize('25.5', 'cm');
    expect(inches).not.toBeNull();
    expect(fmtSize(Math.round((inches ?? 0) * 100) / 100, 'cm')).toBe('25.5');
  });
});

describe('fill, sharpness and enlarging', () => {
  it('fills a piece of another shape, trimming evenly', () => {
    expect(placement(2000, 1000, { w: 8, h: 8 })).toEqual({ x: -4, y: 0, w: 16, h: 8 });
    expect(placement(1000, 2000, { w: 8, h: 8 })).toEqual({ x: 0, y: -4, w: 8, h: 16 });
    expect(placement(1500, 1500, { w: 8, h: 8 })).toEqual({ x: 0, y: 0, w: 8, h: 8 });
  });
  it('works out the detail the file has at the size', () => {
    expect(sourceDpi(1500, 1500, { w: 8, h: 8 })).toBe(187.5);
    expect(sourceDpi(2000, 1000, { w: 8, h: 8 })).toBe(125);
  });
  it('enlarges just enough to reach 300 DPI', () => {
    expect(DPI).toBe(300);
    expect(enlargeFactor(3000, 3000, { w: 8, h: 8 })).toBe(1);
    expect(enlargeFactor(2400, 2400, { w: 8, h: 8 })).toBe(1);
    expect(enlargeFactor(1500, 1500, { w: 8, h: 8 })).toBe(2);
    expect(enlargeFactor(600, 600, { w: 8, h: 8 })).toBe(4);
    expect(enlargeFactor(200, 200, { w: 8, h: 8 })).toBe(4);
  });
  it('never enlarges past what the device can hold', () => {
    expect(MAX_AREA).toBe(16e6);
    // 2500 × 2500 doubled is 25 MP: too big, so the tool prints it as it is.
    expect(enlargeFactor(2500, 2500, { w: 10, h: 10 })).toBe(1);
    // 1500 × 1500 four times is 36 MP: doubling is the most.
    expect(enlargeFactor(1500, 1500, { w: 20, h: 20 })).toBe(2);
  });
  it('finds the biggest sharp size', () => {
    expect(biggestSharp(1500, 1500, 2)).toEqual({ w: 10, h: 10 });
    expect(biggestSharp(1500, 1000, 1)).toEqual({ w: 5, h: 10 / 3 });
    expect(biggestSharp(1500, 1500, 4)).toEqual({ w: 10, h: 10 });
    expect(biggestSharp(100000, 100, 1).w).toBe(MAX_IN);
  });
  it('adds the wrap on every side', () => {
    expect(withWrap({ w: 10, h: 10 }, 0.75)).toEqual({ w: 11.5, h: 11.5 });
    expect(withWrap({ w: 8, h: 6 }, 0)).toEqual({ w: 8, h: 6 });
  });
});

describe('planSheets', () => {
  it('centres a print that fits on one sheet', () => {
    const { sheets, landscape } = planSheets([{ w: 8, h: 8 }], 'letter');
    expect(landscape).toBe(false);
    expect(sheets).toHaveLength(1);
    expect(sheets[0]).toMatchObject({ pw: 8.5, ph: 11 });
    expect(sheets[0]?.items).toEqual([{ design: 0, x0: 0, y0: 0, w: 8, h: 8, px: 0.25, py: expect.closeTo(1.4125, 9), nextX: null, nextY: null }]);
  });
  it('turns the paper when that needs fewer sheets', () => {
    const { sheets, landscape } = planSheets([{ w: 10, h: 7 }], 'letter');
    expect(landscape).toBe(true);
    expect(sheets).toHaveLength(1);
    expect(sheets[0]).toMatchObject({ pw: 11, ph: 8.5 });
  });
  it('keeps ⅛ inch clear at the edges and between prints, and room along the bottom for the ruler (Alex, 2026-11-15)', () => {
    expect(MARGIN_IN).toBe(0.125);
    expect(GAP_IN).toBe(0.125);
    expect(FOOT_IN).toBe(0.3);
    // Four 4 inch coasters on one sheet of US Letter.
    const { sheets } = planSheets([0, 1, 2, 3].map(() => ({ w: 4, h: 4 })), 'letter');
    expect(sheets).toHaveLength(1);
    for (const t of sheets[0]?.items ?? []) expect(t.py + t.h).toBeLessThanOrEqual(11 - FOOT_IN + 1e-9);
  });
  it('splits a big print across sheets with a ¼ inch overlap', () => {
    expect(OVERLAP_IN).toBe(0.25);
    const { sheets } = planSheets([{ w: 16, h: 20 }], 'letter');
    expect(sheets).toHaveLength(4);
    const tiles = sheets.flatMap((s) => s.items);
    // Every tile is inside the paper's printable area.
    for (const s of sheets) for (const t of s.items) {
      expect(t.px + t.w).toBeLessThanOrEqual(s.pw - MARGIN_IN + 1e-9);
      expect(t.py + t.h).toBeLessThanOrEqual(s.ph - FOOT_IN + 1e-9);
    }
    // Neighbours share exactly the overlap, and the tiles cover the whole print.
    const first = tiles[0];
    const right = tiles.find((t) => t.y0 === 0 && t.x0 > 0);
    expect(first && right ? first.x0 + first.w - right.x0 : 0).toBeCloseTo(OVERLAP_IN, 9);
    expect(first?.nextX).toBeCloseTo((first?.w ?? 0) - OVERLAP_IN, 9);
    expect(Math.max(...tiles.map((t) => t.x0 + t.w))).toBeCloseTo(16, 9);
    expect(Math.max(...tiles.map((t) => t.y0 + t.h))).toBeCloseTo(20, 9);
  });
  it('makes one page the size of the print for a print shop', () => {
    expect(PAPERS.print).toEqual({ w: 0, h: 0 });
    const { sheets } = planSheets([{ w: 30, h: 40 }], 'print');
    expect(sheets).toEqual([{ pw: 30, ph: 40, items: [{ design: 0, x0: 0, y0: 0, w: 30, h: 40, px: 0, py: 0, nextX: null, nextY: null }] }]);
  });
  it('fits several small prints on one sheet, with room to cut between them', () => {
    const four = [0, 1, 2, 3].map(() => ({ w: 3, h: 3 }));
    const { sheets } = planSheets(four, 'letter');
    expect(sheets).toHaveLength(1);
    const items = sheets[0]?.items ?? [];
    expect(items.map((i) => i.design).sort()).toEqual([0, 1, 2, 3]);
    for (const a of items) for (const b of items) {
      if (a === b) continue;
      const apart = a.px + a.w + GAP_IN - 1e-9 <= b.px || b.px + b.w + GAP_IN - 1e-9 <= a.px || a.py + a.h + GAP_IN - 1e-9 <= b.py || b.py + b.h + GAP_IN - 1e-9 <= a.py;
      expect(apart).toBe(true);
    }
  });
  it('moves to a new sheet when one is full, and gives a big print its own sheets', () => {
    const many = Array.from({ length: 7 }, () => ({ w: 4, h: 5 }));
    expect(planSheets(many, 'letter').sheets).toHaveLength(2);
    const mixed = planSheets([{ w: 3, h: 3 }, { w: 16, h: 20 }], 'letter');
    expect(mixed.sheets).toHaveLength(5);
    expect(mixed.sheets.filter((s) => s.items.some((i) => i.design === 1))).toHaveLength(4);
  });
  it('gives nothing for no prints', () => {
    expect(planSheets([], 'a4').sheets).toEqual([]);
  });
});

describe('choosing which part of the picture shows (Alex, 2026-11-15)', () => {
  const square = { w: 4, h: 4 };
  it('fills the print, centred, until the maker moves it', () => {
    expect(placement(1000, 2000, square, FILL)).toEqual({ x: 0, y: -2, w: 4, h: 8 });
  });
  it('moves the picture as far as its edge and no further', () => {
    expect(placement(1000, 2000, square, { zoom: 1, x: 0, y: 1 })).toEqual({ x: 0, y: 0, w: 4, h: 8 });
    expect(placement(1000, 2000, square, { zoom: 1, x: 0, y: -1 })).toEqual({ x: 0, y: -4, w: 4, h: 8 });
    expect(nudge(FILL, 0, 1, 1000, 2000, square)).toEqual({ zoom: 1, x: 0, y: 0.5 });
    expect(nudge(FILL, 0, 9, 1000, 2000, square).y).toBe(1);
    // There's no room to move across a picture that exactly fills the width.
    expect(nudge(FILL, 1, 0, 1000, 2000, square).x).toBe(0);
  });
  it('zooms out as far as the whole picture, and in closer', () => {
    expect(minZoom(1000, 2000, square)).toBe(0.5);
    expect(placement(1000, 2000, square, { zoom: 0.5, x: 0, y: 0 })).toEqual({ x: 1, y: 0, w: 2, h: 4 });
    expect(placement(1000, 1000, square, { zoom: 2, x: 0, y: 0 })).toEqual({ x: -2, y: -2, w: 8, h: 8 });
    expect(clampZoom(0.1, 1000, 2000, square)).toBe(0.5);
    expect(clampZoom(9, 1000, 2000, square)).toBe(MAX_ZOOM);
  });
  it('counts the detail at the zoom the maker chose', () => {
    expect(sourceDpi(1200, 1200, square, { zoom: 2, x: 0, y: 0 })).toBe(150);
    expect(enlargeFactor(1200, 1200, square, { zoom: 2, x: 0, y: 0 })).toBe(2);
    expect(enlargeFactor(1200, 1200, square, FILL)).toBe(1);
  });
});

describe('a design made to fill the sheet (Alex, 2026-11-15)', () => {
  it('prints an A4 design on one A4 sheet, edge to edge, at its true size', () => {
    const { sheets } = planSheets([{ w: 8.27, h: 11.69 }], 'a4');
    expect(sheets).toHaveLength(1);
    const t = sheets[0]?.items[0];
    expect(t).toMatchObject({ w: 8.27, h: 11.69, x0: 0, y0: 0, nextX: null, nextY: null });
    expect(fillsSheet(sheets[0] as Sheet)).toBe(true);
  });
  it('does the same for a Letter design on Letter, either way round', () => {
    expect(planSheets([{ w: 8.5, h: 11 }], 'letter').sheets).toHaveLength(1);
    expect(planSheets([{ w: 11, h: 8.5 }], 'letter')).toMatchObject({ landscape: true, sheets: [{ pw: 11, ph: 8.5 }] });
  });
  it('still splits a design that’s bigger than the paper, and leaves room on a smaller one', () => {
    expect(planSheets([{ w: 8.6, h: 11 }], 'letter').sheets.length).toBeGreaterThan(1);
    expect(fillsSheet(planSheets([{ w: 8, h: 8 }], 'letter').sheets[0] as Sheet)).toBe(false);
  });
});
