import { describe, it, expect, vi, afterEach } from 'vitest';
import { BROWSER_MAX_EDGE, fitWithin, shrinkInBrowser, type BrowserPhotoDeps } from './browser-photo';

const file = (name = 'IMG_1.HEIC'): File => new File([new Uint8Array(4)], name, { type: 'image/jpeg' });

describe('fitWithin', () => {
  it('shrinks the longest side to fit and never enlarges', () => {
    expect(fitWithin(4000, 3000, 2000)).toEqual({ width: 2000, height: 1500 });
    expect(fitWithin(3000, 6000, 2000)).toEqual({ width: 1000, height: 2000 });
    expect(fitWithin(800, 600, 2000)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(10000, 1, 2000)).toEqual({ width: 2000, height: 1 });
  });
});

describe('shrinkInBrowser', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('draws it at the fitted size and hands back a JPEG', async () => {
    const close = vi.fn();
    const deps: BrowserPhotoDeps = {
      decode: () => Promise.resolve({ width: 4000, height: 3000, source: {} as CanvasImageSource, close }),
      encode: vi.fn(() => Promise.resolve(new Blob([new Uint8Array(3)], { type: 'image/jpeg' }))),
    };
    const out = await shrinkInBrowser(file(), deps);
    expect(deps.encode).toHaveBeenCalledWith(expect.anything(), BROWSER_MAX_EDGE, 1500, expect.any(Number));
    expect(out.name).toBe('IMG_1.jpg');
    expect(out.type).toBe('image/jpeg');
    expect(close).toHaveBeenCalled();
  });

  it('a photo with no name still gets one, and a failed encode still frees it', async () => {
    const close = vi.fn();
    const ok: BrowserPhotoDeps = {
      decode: () => Promise.resolve({ width: 10, height: 10, source: {} as CanvasImageSource }),
      encode: () => Promise.resolve(new Blob([new Uint8Array(1)])),
    };
    expect((await shrinkInBrowser(file('.jpg'), ok)).name).toBe('photo.jpg');
    const bad: BrowserPhotoDeps = { decode: () => Promise.resolve({ width: 10, height: 10, source: {} as CanvasImageSource, close }), encode: () => Promise.reject(new Error('x')) };
    await expect(shrinkInBrowser(file(), bad)).rejects.toThrow('x');
    expect(close).toHaveBeenCalled();
  });

  it('an unreadable photo throws', async () => {
    await expect(shrinkInBrowser(file(), { decode: () => Promise.reject(new Error('cannot decode')), encode: vi.fn() })).rejects.toThrow('cannot decode');
  });

  it('in the browser: decodes with the photo’s own orientation and encodes on a canvas', async () => {
    const bitmap = { width: 3000, height: 2000, close: vi.fn() };
    const createImageBitmap = vi.fn(() => Promise.resolve(bitmap));
    vi.stubGlobal('createImageBitmap', createImageBitmap);
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (cb) {
      cb(new Blob([new Uint8Array(2)], { type: 'image/jpeg' }));
    });
    const out = await shrinkInBrowser(file());
    expect(createImageBitmap).toHaveBeenCalledWith(expect.any(File), { imageOrientation: 'from-image' });
    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 2000, 1333);
    expect(out.type).toBe('image/jpeg');
    expect(bitmap.close).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('in the browser: no canvas, or a failed encode, throws', async () => {
    vi.stubGlobal('createImageBitmap', () => Promise.resolve({ width: 10, height: 10, close: vi.fn() }));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await expect(shrinkInBrowser(file())).rejects.toThrow('no canvas');
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (cb) {
      cb(null);
    });
    await expect(shrinkInBrowser(file())).rejects.toThrow('could not encode');
    vi.restoreAllMocks();
  });
});
