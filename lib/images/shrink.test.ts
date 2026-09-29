// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { shrinkImage } from './shrink';

// The app reads the binding from the Worker's env; a Worker set up without it has none.
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => Promise.resolve({ env: {} }),
}));

/** A fake Images binding that records the calls made on it and answers with fixed bytes. */
function fakeImages(opts: { fail?: Error } = {}) {
  const calls: { input: number; transform: unknown[]; output: unknown[] } = { input: 0, transform: [], output: [] };
  const transformer = {
    transform(t: unknown) {
      calls.transform.push(t);
      return transformer;
    },
    async output(o: unknown) {
      calls.output.push(o);
      if (opts.fail !== undefined) throw opts.fail;
      return { response: () => new Response(new Uint8Array([1, 2, 3])) };
    },
  };
  const binding = {
    input(stream: ReadableStream<Uint8Array>) {
      expect(stream).toBeInstanceOf(ReadableStream);
      calls.input += 1;
      return transformer;
    },
  };
  return { binding: binding as unknown as ImagesBinding, calls };
}

describe('shrinkImage', () => {
  it('fits the photo inside the edge without enlarging, then encodes to the asked format', async () => {
    const { binding, calls } = fakeImages();
    const out = await shrinkImage(new Uint8Array([9, 9]).buffer, { maxEdge: 1800, format: 'jpeg', quality: 80 }, binding);
    expect(Array.from(out)).toEqual([1, 2, 3]);
    expect(calls.input).toBe(1);
    expect(calls.transform).toEqual([{ width: 1800, height: 1800, fit: 'scale-down' }]);
    expect(calls.output).toEqual([{ format: 'image/jpeg', quality: 80 }]);
  });

  it('asks for WebP when WebP is wanted', async () => {
    const { binding, calls } = fakeImages();
    await shrinkImage(new Uint8Array([9]).buffer, { maxEdge: 2400, format: 'webp', quality: 82 }, binding);
    expect(calls.output).toEqual([{ format: 'image/webp', quality: 82 }]);
  });

  it('lets an unreadable image throw so the caller can tell the person', async () => {
    const { binding } = fakeImages({ fail: new Error('9412: not an image') });
    await expect(shrinkImage(new Uint8Array([0]).buffer, { maxEdge: 1800, format: 'jpeg', quality: 80 }, binding)).rejects.toThrow('9412');
  });

  it('says plainly when the Worker has no Images binding instead of failing obscurely', async () => {
    await expect(shrinkImage(new Uint8Array([9]).buffer, { maxEdge: 1800, format: 'jpeg', quality: 80 })).rejects.toThrow(/Images binding missing/);
  });
});
