// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { finishSceneWith, onePixelBrightness } from './scene-finish';
import { DARK_BELOW, SCENE_HEIGHT, SCENE_WIDTH } from './scene-art';

const bytes = (b64: string): Uint8Array => new Uint8Array(Buffer.from(b64, 'base64'));
// One-pixel PNGs: dark blue-grey (20, 30, 40), near white (240, 240, 230), and grey 90.
const DARK = bytes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGMQkdMAAACkAFt2Ll/jAAAAAElFTkSuQmCC');
const LIGHT = bytes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP48OEZAAWaAsciAL5YAAAAAElFTkSuQmCC');
const GREY = bytes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGOIAgAAXABb2LRWWgAAAABJRU5ErkJggg==');

describe('onePixelBrightness', () => {
  it('reads a colour pixel’s brightness', async () => {
    expect(await onePixelBrightness(DARK)).toBeCloseTo(0.299 * 20 + 0.587 * 30 + 0.114 * 40);
    expect(await onePixelBrightness(LIGHT)).toBeGreaterThan(230);
  });

  it('reads a grey pixel', async () => {
    expect(await onePixelBrightness(GREY)).toBeCloseTo(90);
  });
});

/** Cloudflare's Images binding, answering each output in turn. */
function images(outputs: Uint8Array[]) {
  const transforms: unknown[] = [];
  const formats: unknown[] = [];
  const binding = {
    input: () => {
      const chain = {
        transform: (t: unknown) => (transforms.push(t), chain),
        output: async (o: unknown) => {
          formats.push(o);
          const out = outputs.shift() ?? new Uint8Array();
          return { response: () => new Response(new Uint8Array(out)) };
        },
      };
      return chain;
    },
  };
  return { binding: binding as unknown as ImagesBinding, transforms, formats };
}

describe('finishSceneWith', () => {
  it('sizes the photo to full screen and measures the top for a dark one', async () => {
    const { binding, transforms, formats } = images([new Uint8Array([1, 2, 3]), DARK]);
    const out = await finishSceneWith(binding, new Uint8Array([9]));
    expect(out.webp).toEqual(new Uint8Array([1, 2, 3]));
    expect(out.tone).toBe('dark');
    expect(transforms[0]).toEqual({ width: SCENE_WIDTH, height: SCENE_HEIGHT, fit: 'cover' });
    expect(transforms[1]).toEqual({ trim: { top: 0, left: 0, width: SCENE_WIDTH, height: Math.round(SCENE_HEIGHT * 0.6) } });
    expect(formats).toEqual([{ format: 'image/webp', quality: 82 }, { format: 'image/png' }]);
  });

  it('calls a bright top light', async () => {
    const { binding } = images([new Uint8Array([1]), LIGHT]);
    expect((await finishSceneWith(binding, new Uint8Array([9]))).tone).toBe('light');
    expect(DARK_BELOW).toBeLessThan(230);
  });

  it('fails loudly on a photo the binding can’t read', async () => {
    const broken = { input: () => ({ transform: vi.fn().mockReturnThis(), output: async () => Promise.reject(new Error('not an image')) }) } as unknown as ImagesBinding;
    await expect(finishSceneWith(broken, new Uint8Array([9]))).rejects.toThrow('not an image');
  });
});
