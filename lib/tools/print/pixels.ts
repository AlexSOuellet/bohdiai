/** Print it's pixel work, on raw RGBA pixels: finding the art inside a white border,
 *  and lifting the colour for thin paper. */

/** Lighter than this on every channel counts as blank paper. */
const PAPER = 242;

/** The box holding everything that isn't blank paper (x1, y1 just past it), or null
 *  when the whole picture is blank. */
export function whiteBounds(data: Uint8ClampedArray, w: number, h: number): { x0: number; y0: number; x1: number; y1: number } | null {
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if ((data[i] ?? 255) < PAPER || (data[i + 1] ?? 255) < PAPER || (data[i + 2] ?? 255) < PAPER) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x0, y0, x1: x1 + 1, y1: y1 + 1 };
}

const GAMMA = 0.85;
const SATURATION = 1.2;
const LIFT = ((): Uint8ClampedArray => {
  const t = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) t[v] = Math.round(255 * (v / 255) ** GAMMA);
  return t;
})();

/** Brighter for thin paper: lifts the middle tones and the colour so prints don't
 *  wash out on rice paper or tissue. White stays white and black stays black. */
export function brighten(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const r = LIFT[data[i] ?? 0] ?? 0;
    const g = LIFT[data[i + 1] ?? 0] ?? 0;
    const b = LIFT[data[i + 2] ?? 0] ?? 0;
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    data[i] = y + SATURATION * (r - y);
    data[i + 1] = y + SATURATION * (g - y);
    data[i + 2] = y + SATURATION * (b - y);
  }
}
