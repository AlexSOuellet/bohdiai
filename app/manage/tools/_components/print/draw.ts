/** Drawing a print, or one sheet's part of it, at a set DPI on the maker's device:
 *  the picture filling the print, mirrored or brightened if asked, and a round or
 *  oval piece's cut line. */
import { FILL, MAX_AREA, placement, type Frame, type Job } from '@/lib/tools/print/layout';
import { brighten, whiteBounds } from '@/lib/tools/print/pixels';
import type { PieceShape } from '@/lib/tools/print/pieces';

/** frame: which part of the picture shows (filling the print when left out). */
/** extend: fill any space around a zoomed-out design by mirroring it outward (Alex, 2026-11-15). */
export type Look = { mirror: boolean; brighter: boolean; frame?: Frame; extend?: boolean };
export type Cut = { shape: PieceShape; wrapIn: number };
export type Region = { x0: number; y0: number; w: number; h: number };

const CUT_GREY = '#555';
const EDGE_GREY = '#9a9a9a';

function canvasOf(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (ctx === null) throw new Error('This device couldn’t draw the print.');
  return { canvas, ctx };
}

/** The picture with its white border trimmed off (found on a small copy, cut from the full one). */
export function trimmed(src: HTMLCanvasElement): HTMLCanvasElement {
  const k = Math.min(1, 800 / Math.max(src.width, src.height));
  const small = canvasOf(src.width * k, src.height * k);
  small.ctx.fillStyle = '#fff';
  small.ctx.fillRect(0, 0, small.canvas.width, small.canvas.height);
  small.ctx.drawImage(src, 0, 0, small.canvas.width, small.canvas.height);
  const box = whiteBounds(small.ctx.getImageData(0, 0, small.canvas.width, small.canvas.height).data, small.canvas.width, small.canvas.height);
  if (box === null) return src;
  const x0 = Math.max(0, Math.floor(box.x0 / k));
  const y0 = Math.max(0, Math.floor(box.y0 / k));
  const x1 = Math.min(src.width, Math.ceil(box.x1 / k));
  const y1 = Math.min(src.height, Math.ceil(box.y1 / k));
  if (x1 - x0 >= src.width - 2 && y1 - y0 >= src.height - 2) return src;
  const out = canvasOf(x1 - x0, y1 - y0);
  out.ctx.drawImage(src, x0, y0, x1 - x0, y1 - y0, 0, 0, x1 - x0, y1 - y0);
  return out.canvas;
}

/** Draws the print into ctx, which is already set to the print's inches. */
export function paintPrint(ctx: CanvasRenderingContext2D, src: HTMLCanvasElement, job: Job, look: Look, cut: Cut, inch: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, job.w, job.h);
  ctx.clip();
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, job.w, job.h);
  // A round or oval piece shows, and prints, round: nothing outside its edge.
  if (cut.shape !== 'rect') {
    ctx.beginPath();
    ctx.ellipse(job.w / 2, job.h / 2, job.w / 2, job.h / 2, 0, 0, Math.PI * 2);
    ctx.clip();
  }
  ctx.save();
  if (look.mirror) {
    ctx.translate(job.w, 0);
    ctx.scale(-1, 1);
  }
  const p = placement(src.width, src.height, job, look.frame ?? FILL);
  ctx.imageSmoothingQuality = 'high';
  if (look.extend === true && (p.w < job.w - 1e-6 || p.h < job.h - 1e-6)) extended(ctx, src, job, p);
  else ctx.drawImage(src, p.x, p.y, p.w, p.h);
  ctx.restore();
  ctx.restore();
  cutLines(ctx, job, cut, inch);
}

/** The design with mirrored copies of itself around it, out to the print's edges, so the
 *  background carries on with no seam and no white. Done on the device, no AI. */
function extended(ctx: CanvasRenderingContext2D, src: HTMLCanvasElement, job: Job, p: { x: number; y: number; w: number; h: number }): void {
  const odd = (n: number): boolean => Math.abs(n) % 2 === 1;
  const cols = [Math.floor(-p.x / p.w), Math.ceil((job.w - p.x) / p.w) - 1];
  const rows = [Math.floor(-p.y / p.h), Math.ceil((job.h - p.y) / p.h) - 1];
  for (let iy = rows[0] ?? 0; iy <= (rows[1] ?? 0); iy++) {
    for (let ix = cols[0] ?? 0; ix <= (cols[1] ?? 0); ix++) {
      ctx.save();
      ctx.translate(p.x + ix * p.w + (odd(ix) ? p.w : 0), p.y + iy * p.h + (odd(iy) ? p.h : 0));
      ctx.scale(odd(ix) ? -1 : 1, odd(iy) ? -1 : 1);
      ctx.drawImage(src, 0, 0, p.w, p.h);
      ctx.restore();
    }
  }
}

/** A round or oval piece's cut line around the print, and (with a wrap) a lighter
 *  dashed line where the piece's edge is. A rectangle is cut at the corner marks. */
function cutLines(ctx: CanvasRenderingContext2D, job: Job, cut: Cut, inch: number): void {
  const line = (inset: number, color: string, dash: number[]): void => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5 / inch;
    ctx.setLineDash(dash.map((d) => d / inch));
    ctx.beginPath();
    if (cut.shape === 'rect') ctx.rect(inset, inset, job.w - 2 * inset, job.h - 2 * inset);
    else ctx.ellipse(job.w / 2, job.h / 2, Math.max(0, job.w / 2 - inset), Math.max(0, job.h / 2 - inset), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };
  const lw = 0.75 / inch;
  if (cut.shape !== 'rect') line(lw, CUT_GREY, [12, 6]);
  if (cut.wrapIn > 0) line(cut.wrapIn, EDGE_GREY, [4, 6]);
}

/** One part of a print at a DPI (lowered if needed to stay within what the device can hold). */
export function drawRegion(src: HTMLCanvasElement, job: Job, region: Region, dpi: number, look: Look, cut: Cut): { canvas: HTMLCanvasElement; dpi: number } {
  let d = dpi;
  if (region.w * region.h * d * d > MAX_AREA) d = Math.floor(Math.sqrt(MAX_AREA / (region.w * region.h)));
  const { canvas, ctx } = canvasOf(region.w * d, region.h * d);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(canvas.width / region.w, canvas.height / region.h);
  ctx.translate(-region.x0, -region.y0);
  paintPrint(ctx, src, job, { ...look, brighter: false }, cut, d);
  ctx.restore();
  if (look.brighter) {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    brighten(img.data);
    ctx.putImageData(img, 0, 0);
  }
  return { canvas, dpi: d };
}
