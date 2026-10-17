import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const subscribe = vi.fn();
const upload = vi.fn();
vi.mock('@fal-ai/client', () => ({ createFalClient: () => ({ subscribe, storage: { upload } }) }));

import { falPainter } from './scene-painter';

beforeEach(() => {
  subscribe.mockReset();
  upload.mockReset();
  vi.stubGlobal('fetch', vi.fn(async (url: string) => (url.includes('broken') ? new Response('', { status: 500 }) : new Response(new Uint8Array([1, 2, 3])))));
});
afterEach(() => vi.unstubAllGlobals());

describe('falPainter', () => {
  it('paints a wide photo from the description and brings it back', async () => {
    subscribe.mockResolvedValueOnce({ data: { images: [{ url: 'https://fal/one.jpg' }] } });
    const photo = await falPainter('key').paint('A quiet room');
    expect([...photo]).toEqual([1, 2, 3]);
    expect(subscribe.mock.calls[0]?.[0]).toBe('fal-ai/flux-pro');
    expect(subscribe.mock.calls[0]?.[1].input).toMatchObject({ prompt: 'A quiet room', image_size: 'landscape_16_9' });
  });

  it('enlarges a photo 2x', async () => {
    upload.mockResolvedValueOnce('https://fal/in.jpg');
    subscribe.mockResolvedValueOnce({ data: { image: { url: 'https://fal/big.png' } } });
    await falPainter('key').enlarge(Buffer.from([9]));
    expect(subscribe.mock.calls[0]?.[0]).toBe('fal-ai/esrgan');
    expect(subscribe.mock.calls[0]?.[1].input).toEqual({ image_url: 'https://fal/in.jpg', scale: 2 });
  });

  it('says so when nothing comes back, or the photo can’t be fetched', async () => {
    subscribe.mockResolvedValueOnce({ data: { images: [] } });
    await expect(falPainter('key').paint('x')).rejects.toThrow('the painter sent no photo back');
    upload.mockResolvedValueOnce('https://fal/in.jpg');
    subscribe.mockResolvedValueOnce({ data: {} });
    await expect(falPainter('key').enlarge(Buffer.from([9]))).rejects.toThrow('the enlarger sent no photo back');
    subscribe.mockResolvedValueOnce({ data: { images: [{ url: 'https://fal/broken.jpg' }] } });
    await expect(falPainter('key').paint('x')).rejects.toThrow('fetching the photo failed (500)');
  });
});
