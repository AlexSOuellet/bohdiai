/** Making a picture sharper with AI, on the maker's own device (UpscalerJS's ESRGAN
 *  models, served from BohdiAI itself, nothing sent anywhere). Each pass doubles the
 *  picture; 4 is two passes. The best-detail model first, the fast one if the device
 *  can't run it. */

export const ENLARGE_FAILED = 'This device couldn’t make the picture sharper.';
export const ENLARGE_STOPPED = 'stopped';

type Model = 'medium' | 'slim';
const MODELS: readonly Model[] = ['medium', 'slim'];
const PATCH = 128;
const PADDING = 8;

async function pass(src: HTMLCanvasElement, model: Model, onProgress: (f: number) => void, signal: AbortSignal): Promise<HTMLCanvasElement> {
  const tf = await import('@tensorflow/tfjs');
  // Without WebGL the models crawl on the processor for minutes; give up at once and
  // print from the original instead.
  const gpu = await tf.setBackend('webgl').catch(() => false);
  await tf.ready();
  if (!gpu || tf.getBackend() !== 'webgl') throw new Error(ENLARGE_FAILED);
  const { default: Upscaler } = await import('upscaler');
  const definition = model === 'medium' ? (await import('@upscalerjs/esrgan-medium/2x')).default : (await import('@upscalerjs/esrgan-slim/2x')).default;
  const upscaler = new Upscaler({ model: { ...definition, path: `/print-models/${model}/model.json` } });
  const input = tf.browser.fromPixels(src);
  try {
    const out = await upscaler.execute(input, { output: 'tensor', patchSize: PATCH, padding: PADDING, signal, awaitNextFrame: true, progress: (rate: number) => onProgress(rate) });
    const pixels = tf.tidy(() => out.clipByValue(0, 255).cast('int32'));
    out.dispose();
    const canvas = document.createElement('canvas');
    canvas.width = src.width * 2;
    canvas.height = src.height * 2;
    await tf.browser.toPixels(pixels as Parameters<typeof tf.browser.toPixels>[0], canvas);
    pixels.dispose();
    return canvas;
  } finally {
    input.dispose();
    await upscaler.dispose();
  }
}

/** The picture enlarged by factor. Rejects with ENLARGE_STOPPED when stopped, or
 *  ENLARGE_FAILED when the device can't do it. */
export async function enlarge(src: HTMLCanvasElement, factor: 2 | 4, onProgress: (f: number) => void, signal: AbortSignal): Promise<HTMLCanvasElement> {
  const passes = factor === 4 ? 2 : 1;
  for (const model of MODELS) {
    try {
      let img = src;
      for (let p = 0; p < passes; p++) {
        img = await pass(img, model, (f) => onProgress((p + f) / passes), signal);
      }
      return img;
    } catch (err) {
      if (signal.aborted) throw new Error(ENLARGE_STOPPED);
      // No WebGL: the fast model won't do any better.
      if (err instanceof Error && err.message === ENLARGE_FAILED) break;
    }
  }
  throw new Error(ENLARGE_FAILED);
}
