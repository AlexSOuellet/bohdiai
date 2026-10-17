/** The painter behind the scene maker: fal.ai paints a wide photo from a
 *  description, then enlarges it 2x so it fills a big screen. */
import { createFalClient } from '@fal-ai/client';
import { withTimeout } from '@/lib/with-timeout';
import type { ScenePainter } from './scene-art';

const PAINT_MODEL = 'fal-ai/flux-pro';
const ENLARGE_MODEL = 'fal-ai/esrgan';
const TIMEOUT_MS = 120_000;

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetching the photo failed (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

export function falPainter(apiKey: string): ScenePainter {
  const fal = createFalClient({ credentials: apiKey });
  return {
    paint: async (picture) => {
      const r = await withTimeout(
        (signal) => fal.subscribe(PAINT_MODEL, { input: { prompt: picture, image_size: 'landscape_16_9', num_inference_steps: 28, guidance_scale: 3.5, num_images: 1, output_format: 'jpeg' }, abortSignal: signal }),
        TIMEOUT_MS,
        'painting a background photo',
      );
      const url = (r.data as { images?: { url: string }[] }).images?.[0]?.url;
      if (url === undefined) throw new Error('the painter sent no photo back');
      return download(url);
    },
    enlarge: async (photo) => {
      const uploaded = await fal.storage.upload(new Blob([new Uint8Array(photo)], { type: 'image/jpeg' }));
      const r = await withTimeout(
        (signal) => fal.subscribe(ENLARGE_MODEL, { input: { image_url: uploaded, scale: 2 }, abortSignal: signal }),
        TIMEOUT_MS,
        'enlarging a background photo',
      );
      const url = (r.data as { image?: { url: string } }).image?.url;
      if (url === undefined) throw new Error('the enlarger sent no photo back');
      return download(url);
    },
  };
}
