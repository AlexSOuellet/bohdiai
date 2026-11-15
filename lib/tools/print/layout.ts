/**
 * Print it's maths (Alex, 2026-11-15): sizes, sharpness, enlarging and sheets.
 * Everything is in inches. The tool decides these itself so the maker only adds a
 * picture and a size: always 300 DPI, enlarged just enough, fewest sheets, a ¼ in
 * overlap where a print spans sheets, and the proportions always kept.
 */

export const DPI = 300;
export const OVERLAP_IN = 0.25;
export const MARGIN_IN = 0.25;
/** Room left between prints sharing a sheet, to cut them apart. */
export const GAP_IN = 0.25;
/** The most pixels one picture may have, so phones can hold it. */
export const MAX_AREA = 16e6;
export const MAX_IN = 200;
/** The most sheets one job may take; past this the maker is asked for a smaller size or bigger paper. */
export const SHEETS_MAX = 100;
const CM = 2.54;
const EPS = 1e-6;

export type Unit = 'in' | 'cm';
export type PaperKey = 'letter' | 'legal' | 'tabloid' | 'a4' | 'a3' | 'print';
export const PAPER_KEYS: readonly PaperKey[] = ['letter', 'legal', 'tabloid', 'a4', 'a3', 'print'];
/** Portrait sizes in inches; print is one page the size of the print. */
export const PAPERS: Readonly<Record<PaperKey, { w: number; h: number }>> = {
  letter: { w: 8.5, h: 11 },
  legal: { w: 8.5, h: 14 },
  tabloid: { w: 11, h: 17 },
  a4: { w: 8.268, h: 11.693 },
  a3: { w: 11.693, h: 16.535 },
  print: { w: 0, h: 0 },
};

/** A print's size in inches (any wrap included). */
export type Job = { w: number; h: number };
/** One print's part on one sheet: the part of the print (x0, y0, w, h) and where it
 *  sits on the page (px, py). nextX / nextY: where the next sheet's part starts,
 *  measured from this part's own edge, when the print goes on. */
export type SheetItem = { design: number; x0: number; y0: number; w: number; h: number; px: number; py: number; nextX: number | null; nextY: number | null };
export type Sheet = { pw: number; ph: number; items: SheetItem[] };

/** A typed size in inches, or null when it isn't a size. Capped at MAX_IN. */
export function parseSize(text: string, unit: Unit): number | null {
  const t = text.trim();
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(t)) return null;
  const n = Number(t);
  if (!(n > 0)) return null;
  return Math.min(MAX_IN, unit === 'cm' ? n / CM : n);
}

/** A size shown in the maker's unit: 2 decimals for inches, 1 for cm, no trailing zeros. */
export function fmtSize(inches: number, unit: Unit): string {
  const v = unit === 'cm' ? inches * CM : inches;
  return String(Number(v.toFixed(unit === 'cm' ? 1 : 2)));
}

/** A size kept in proportion so neither side is over MAX_IN. */
export function capSize(w: number, h: number): Job {
  const big = Math.max(w, h);
  if (big <= MAX_IN) return { w, h };
  return w >= h ? { w: MAX_IN, h: (h * MAX_IN) / w } : { w: (w * MAX_IN) / h, h: MAX_IN };
}

export function withWrap(piece: Job, wrapIn: number): Job {
  return { w: piece.w + 2 * wrapIn, h: piece.h + 2 * wrapIn };
}

/** Which part of the picture shows when its shape differs from the print's (Alex,
 *  2026-11-15): zoom 1 fills the print; less shows more of the picture, down to the
 *  whole of it; more comes in closer. x and y run from -1 to 1 across the room the
 *  picture has to move, 0 centred. */
export type Frame = { zoom: number; x: number; y: number };
export const FILL: Frame = { zoom: 1, x: 0, y: 0 };
export const MAX_ZOOM = 4;

const clamp1 = (n: number): number => Math.max(-1, Math.min(1, n));

/** The furthest out the maker can zoom: the whole picture inside the print. */
export function minZoom(srcW: number, srcH: number, job: Job): number {
  return Math.min(job.w / srcW, job.h / srcH) / Math.max(job.w / srcW, job.h / srcH);
}

export function clampZoom(zoom: number, srcW: number, srcH: number, job: Job): number {
  return Math.max(minZoom(srcW, srcH, job), Math.min(MAX_ZOOM, zoom));
}

/** Where the picture sits in the print: filling it, the extra trimmed evenly, unless
 *  the maker moved or zoomed it. */
export function placement(srcW: number, srcH: number, job: Job, frame: Frame = FILL): { x: number; y: number; w: number; h: number } {
  const k = Math.max(job.w / srcW, job.h / srcH) * frame.zoom;
  const w = srcW * k;
  const h = srcH * k;
  return { x: (job.w - w) / 2 + (frame.x * Math.abs(w - job.w)) / 2, y: (job.h - h) / 2 + (frame.y * Math.abs(h - job.h)) / 2, w, h };
}

/** The frame after the maker drags the picture by dx, dy inches. */
export function nudge(frame: Frame, dx: number, dy: number, srcW: number, srcH: number, job: Job): Frame {
  const p = placement(srcW, srcH, job, frame);
  const roomX = Math.abs(p.w - job.w) / 2;
  const roomY = Math.abs(p.h - job.h) / 2;
  return { zoom: frame.zoom, x: roomX > EPS ? clamp1(frame.x + dx / roomX) : 0, y: roomY > EPS ? clamp1(frame.y + dy / roomY) : 0 };
}

/** The detail the file has at this size, in dots per inch. */
export function sourceDpi(srcW: number, srcH: number, job: Job, frame: Frame = FILL): number {
  return srcW / placement(srcW, srcH, job, frame).w;
}

const fits = (srcW: number, srcH: number, f: number): boolean => srcW * srcH * f * f <= MAX_AREA;

/** How much to enlarge: the least that reaches 300 DPI, or the most the device can
 *  hold when nothing reaches it. 4 is two doublings. */
export function enlargeFactor(srcW: number, srcH: number, job: Job, frame: Frame = FILL): 1 | 2 | 4 {
  const d = sourceDpi(srcW, srcH, job, frame);
  if (d >= DPI - 0.5) return 1;
  let best: 1 | 2 | 4 = 1;
  for (const f of [2, 4] as const) {
    if (!fits(srcW, srcH, f)) break;
    best = f;
    if (d * f >= DPI - 0.5) return f;
  }
  return best;
}

/** The biggest the file prints sharp, enlarging by up to maxFactor. */
export function biggestSharp(srcW: number, srcH: number, maxFactor: 1 | 2 | 4): Job {
  let f: number = maxFactor;
  while (f > 1 && !fits(srcW, srcH, f)) f /= 2;
  const w = (srcW * f) / DPI;
  const h = (srcH * f) / DPI;
  return capSize(w, h);
}

const tileCount = (size: number, avail: number): number => (size <= avail + EPS ? 1 : Math.ceil((size - OVERLAP_IN) / (avail - OVERLAP_IN) - EPS));

/** A print bigger than the paper, split across sheets that overlap. */
function tile(design: number, job: Job, pw: number, ph: number): Sheet[] {
  const aw = pw - 2 * MARGIN_IN;
  const ah = ph - 2 * MARGIN_IN;
  const cols = tileCount(job.w, aw);
  const rows = tileCount(job.h, ah);
  const sx = aw - OVERLAP_IN;
  const sy = ah - OVERLAP_IN;
  const out: Sheet[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = c * sx;
      const y0 = r * sy;
      out.push({
        pw,
        ph,
        items: [{ design, x0, y0, w: Math.min(aw, job.w - x0), h: Math.min(ah, job.h - y0), px: MARGIN_IN, py: MARGIN_IN, nextX: c < cols - 1 ? sx : null, nextY: r < rows - 1 ? sy : null }],
      });
    }
  }
  return out;
}

/** Prints that fit a sheet, in shelves: tallest first, left to right, a cut gap between. */
function pack(designs: ReadonlyArray<{ i: number; job: Job }>, pw: number, ph: number): Sheet[] {
  const aw = pw - 2 * MARGIN_IN;
  const ah = ph - 2 * MARGIN_IN;
  const order = [...designs].sort((a, b) => b.job.h - a.job.h || a.i - b.i);
  const sheets: Sheet[] = [];
  let sheet: Sheet | null = null;
  let x = 0;
  let shelfY = 0;
  let shelfH = 0;
  for (const { i, job } of order) {
    if (sheet !== null && x > 0 && x + job.w > aw + EPS) {
      shelfY += shelfH + GAP_IN;
      x = 0;
      shelfH = 0;
    }
    if (sheet === null || shelfY + job.h > ah + EPS) {
      sheet = { pw, ph, items: [] };
      sheets.push(sheet);
      x = 0;
      shelfY = 0;
      shelfH = 0;
    }
    sheet.items.push({ design: i, x0: 0, y0: 0, w: job.w, h: job.h, px: MARGIN_IN + x, py: MARGIN_IN + shelfY, nextX: null, nextY: null });
    x += job.w + GAP_IN;
    shelfH = Math.max(shelfH, job.h);
  }
  // A print alone on its sheet sits in the middle.
  for (const s of sheets) {
    const only = s.items.length === 1 ? s.items[0] : undefined;
    if (only !== undefined) {
      only.px = (pw - only.w) / 2;
      only.py = (ph - only.h) / 2;
    }
  }
  return sheets;
}

function layoutOn(designs: readonly Job[], pw: number, ph: number): Sheet[] {
  const aw = pw - 2 * MARGIN_IN;
  const ah = ph - 2 * MARGIN_IN;
  const small: Array<{ i: number; job: Job }> = [];
  const big: Sheet[] = [];
  designs.forEach((job, i) => {
    if (job.w <= aw + EPS && job.h <= ah + EPS) small.push({ i, job });
    else big.push(...tile(i, job, pw, ph));
  });
  return [...pack(small, pw, ph), ...big];
}

/** Every print laid out on the paper, on the fewest sheets: the paper turned
 *  whichever way needs fewer (upright when it's the same). */
export function planSheets(designs: readonly Job[], paper: PaperKey): { sheets: Sheet[]; landscape: boolean } {
  if (paper === 'print') {
    return { sheets: designs.map((job, i) => ({ pw: job.w, ph: job.h, items: [{ design: i, x0: 0, y0: 0, w: job.w, h: job.h, px: 0, py: 0, nextX: null, nextY: null }] })), landscape: false };
  }
  const { w, h } = PAPERS[paper];
  const upright = layoutOn(designs, w, h);
  const turned = layoutOn(designs, h, w);
  return turned.length < upright.length ? { sheets: turned, landscape: true } : { sheets: upright, landscape: false };
}
