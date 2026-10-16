/**
 * Shrinks a photo on the maker's own phone or computer before it's sent, so ten
 * photos go through on a slow connection. The server shrinks again to WebP.
 * Throws when the photo can't be read here (the page then says so).
 */
export const BROWSER_MAX_EDGE = 2000;
const QUALITY = 0.86;

export type Decoded = { width: number; height: number; source: CanvasImageSource; close?: () => void };

export type BrowserPhotoDeps = {
  decode: (file: File) => Promise<Decoded>;
  encode: (source: CanvasImageSource, width: number, height: number, quality: number) => Promise<Blob>;
};

/** The size a photo is drawn at: the longest side at most `max`, never enlarged. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

const browserDeps: BrowserPhotoDeps = {
  decode: async (file) => {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return { width: bitmap.width, height: bitmap.height, source: bitmap, close: () => bitmap.close() };
  },
  encode: (source, width, height, quality) =>
    new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx === null) {
        reject(new Error('no canvas'));
        return;
      }
      ctx.drawImage(source, 0, 0, width, height);
      canvas.toBlob((blob) => (blob === null ? reject(new Error('could not encode')) : resolve(blob)), 'image/jpeg', quality);
    }),
};

/** The photo as a JPEG no bigger than BROWSER_MAX_EDGE on its longest side. */
export async function shrinkInBrowser(file: File, deps: BrowserPhotoDeps = browserDeps): Promise<File> {
  const decoded = await deps.decode(file);
  try {
    const size = fitWithin(decoded.width, decoded.height, BROWSER_MAX_EDGE);
    const blob = await deps.encode(decoded.source, size.width, size.height, QUALITY);
    const base = file.name.replace(/\.[^.]*$/, '') || 'photo';
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
  } finally {
    decoded.close?.();
  }
}
