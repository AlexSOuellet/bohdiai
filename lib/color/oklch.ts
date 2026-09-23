/**
 * OKLCH ↔ sRGB hex, via Björn Ottosson's Oklab. Pure, no dependencies.
 * OKLCH is used for brand-palette derivation because its L tracks perceived
 * lightness: shifting L keeps a brand hue recognisably "the same green".
 */
export interface Oklch {
  l: number;
  c: number;
  h: number;
}

type Rgb = [number, number, number];

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function toLinear(v: number): number {
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function fromLinear(v: number): number {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
}

function hexToLinear(hex: string): Rgb {
  return [
    toLinear(parseInt(hex.slice(1, 3), 16) / 255),
    toLinear(parseInt(hex.slice(3, 5), 16) / 255),
    toLinear(parseInt(hex.slice(5, 7), 16) / 255),
  ];
}

function linearToOklab([r, g, b]: Rgb): Rgb {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklchToLinear({ l, c, h }: Oklch): Rgb {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

function inGamut(rgb: Rgb): boolean {
  return rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);
}

export function hexToOklch(hex: string): Oklch {
  const [l, a, b] = linearToOklab(hexToLinear(hex));
  const c = Math.sqrt(a * a + b * b);
  const deg = (Math.atan2(b, a) * 180) / Math.PI;
  return { l, c, h: deg < 0 ? deg + 360 : deg };
}

/** OKLCH → hex. Out-of-gamut chroma is reduced (hue and lightness kept). */
export function oklchToHex(color: Oklch): string {
  const l = clamp(color.l, 0, 1);
  const h = color.h;
  let c = Math.max(0, color.c);
  if (!inGamut(oklchToLinear({ l, c, h }))) {
    let lo = 0;
    let hi = c;
    for (let i = 0; i < 24; i += 1) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear({ l, c: mid, h }))) lo = mid;
      else hi = mid;
    }
    c = lo;
  }
  const rgb = oklchToLinear({ l, c, h });
  return `#${rgb
    .map((v) => Math.round(clamp(fromLinear(clamp(v, 0, 1)), 0, 1) * 255).toString(16).padStart(2, '0'))
    .join('')}`;
}

/** Perceptual distance (Euclidean in Oklab). 0 = identical, ~1 = black vs white. */
export function deltaE(hexA: string, hexB: string): number {
  const [l1, a1, b1] = linearToOklab(hexToLinear(hexA));
  const [l2, a2, b2] = linearToOklab(hexToLinear(hexB));
  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
