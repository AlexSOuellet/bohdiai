/**
 * Finishing a background photo on Cloudflare (Session 119), where the image
 * library the hand-run builder uses (sharp) can't load: Cloudflare's own Images
 * binding sizes it to full screen, and measures how dark the top of it is (where
 * the name sits) by shrinking that part to a single pixel and reading it.
 */
import { DARK_BELOW, SCENE_HEIGHT, SCENE_WIDTH } from './scene-art';

/** The part of the photo measured for tone: the top 60%, where the name sits. */
const MEASURED = 0.6;

async function inflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([new Uint8Array(bytes)]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** How bright a one-pixel PNG is, 0 (black) to 255 (white). */
export async function onePixelBrightness(png: Uint8Array): Promise<number> {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  let colorType = -1;
  const data: Uint8Array[] = [];
  for (let at = 8; at + 8 <= png.length; ) {
    const length = view.getUint32(at);
    const type = String.fromCharCode(...png.subarray(at + 4, at + 8));
    const body = png.subarray(at + 8, at + 8 + length);
    if (type === 'IHDR') colorType = body[9] ?? -1;
    if (type === 'IDAT') data.push(body);
    at += 12 + length;
  }
  const joined = new Uint8Array(data.reduce((n, d) => n + d.length, 0));
  let offset = 0;
  for (const d of data) {
    joined.set(d, offset);
    offset += d.length;
  }
  // One row: a filter byte, then the pixel. One pixel has nothing to filter against.
  const row = await inflate(joined);
  const [r = 255, g = r, b = r] = colorType === 0 || colorType === 4 ? [row[1], row[1], row[1]] : [row[1], row[2], row[3]];
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** A photo at full-screen size, and whether it reads dark where the name sits. */
export async function finishSceneWith(images: ImagesBinding, photo: Uint8Array): Promise<{ webp: Uint8Array; tone: 'light' | 'dark' }> {
  const sized = await images
    .input(new Blob([new Uint8Array(photo)]).stream())
    .transform({ width: SCENE_WIDTH, height: SCENE_HEIGHT, fit: 'cover' })
    .output({ format: 'image/webp', quality: 82 });
  const webp = new Uint8Array(await sized.response().arrayBuffer());
  const pixel = await images
    .input(new Blob([new Uint8Array(webp)]).stream())
    .transform({ trim: { top: 0, left: 0, width: SCENE_WIDTH, height: Math.round(SCENE_HEIGHT * MEASURED) } })
    .transform({ width: 1, height: 1, fit: 'scale-down' })
    .output({ format: 'image/png' });
  const brightness = await onePixelBrightness(new Uint8Array(await pixel.response().arrayBuffer()));
  return { webp, tone: brightness < DARK_BELOW ? 'dark' : 'light' };
}
