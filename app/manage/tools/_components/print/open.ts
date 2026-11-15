/** Opening the maker's picture on their own device: a JPG or PNG, or one page of a
 *  PDF drawn at 300 DPI. Nothing is sent anywhere. Big pictures are scaled to what
 *  a phone can hold. */
import { DPI, MAX_AREA } from '@/lib/tools/print/layout';

export type Picture = { canvas: HTMLCanvasElement; name: string; pages: number; page: number; file: File };

export const OPEN_FAILED = 'That file couldn’t be opened. Try a JPG, PNG or PDF.';

const isPdf = (f: File): boolean => f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
const baseName = (f: File): string => f.name.replace(/\.[^.]+$/, '').trim() || 'picture';

/** The scale that keeps w × h within the area a phone can hold. */
export function fitScale(w: number, h: number): number {
  return Math.min(1, Math.sqrt(MAX_AREA / (w * h)));
}

function blank(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error(OPEN_FAILED);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}

async function openImage(file: File): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error(OPEN_FAILED));
      im.src = url;
    });
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!(w > 0 && h > 0)) throw new Error(OPEN_FAILED);
    const k = fitScale(w, h);
    const { canvas, ctx } = blank(w * k, h * k);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function openPdf(file: File, page: number): Promise<{ canvas: HTMLCanvasElement; pages: number; page: number }> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  try {
    const n = Math.min(Math.max(1, page), doc.numPages);
    const p = await doc.getPage(n);
    const one = p.getViewport({ scale: 1 });
    const scale = (DPI / 72) * fitScale((one.width * DPI) / 72, (one.height * DPI) / 72);
    const viewport = p.getViewport({ scale });
    const { canvas } = blank(viewport.width, viewport.height);
    await p.render({ canvas, viewport, background: '#ffffff' }).promise;
    return { canvas, pages: doc.numPages, page: n };
  } finally {
    void task.destroy();
  }
}

/** The picture, ready to size. Throws an Error whose message is for the maker. */
export async function openPicture(file: File, page = 1): Promise<Picture> {
  try {
    if (isPdf(file)) {
      const pdf = await openPdf(file, page);
      return { ...pdf, name: baseName(file), file };
    }
    if (file.type !== '' && !file.type.startsWith('image/')) throw new Error(OPEN_FAILED);
    return { canvas: await openImage(file), name: baseName(file), pages: 1, page: 1, file };
  } catch {
    throw new Error(OPEN_FAILED);
  }
}
