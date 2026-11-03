/**
 * Finishing a background photo on a computer (the hand-run scripts): sized to full
 * screen with sharp, and measured across the top, where the name sits. Never
 * imported by the app: sharp can't run on Cloudflare, and on the dev server it
 * stops Cloudflare's own image simulator from loading (Session 119). The app uses
 * scene-finish.ts.
 */
import sharp from 'sharp';
import { DARK_BELOW, SCENE_HEIGHT, SCENE_WIDTH } from './scene-art';

/** A photo saved at full-screen size, and whether it reads dark where the name sits. */
export async function finishScene(photo: Buffer): Promise<{ webp: Buffer; tone: 'light' | 'dark' }> {
  const sized = sharp(photo).resize(SCENE_WIDTH, SCENE_HEIGHT, { fit: 'cover', kernel: 'lanczos3' });
  const webp = await sized.clone().webp({ quality: 82 }).toBuffer();
  const top = await sharp(webp)
    .extract({ left: 0, top: 0, width: SCENE_WIDTH, height: Math.round(SCENE_HEIGHT * 0.6) })
    .greyscale()
    .stats();
  const mean = top.channels[0]?.mean ?? 255;
  return { webp, tone: mean < DARK_BELOW ? 'dark' : 'light' };
}
