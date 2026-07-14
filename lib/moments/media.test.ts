import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock SDK + helpers (mirrors lib/fal.test.ts) ──────────────────────────────

const subscribeMock = vi.fn();
const createFalClientSpy = vi.fn(() => ({ subscribe: subscribeMock }));

vi.mock('@fal-ai/client', () => ({
  createFalClient: (...args: unknown[]) => createFalClientSpy(...(args as [])),
}));

vi.mock('@/lib/env', () => ({
  serverEnv: () => ({ FAL_API_KEY: 'fal-test-key' }),
}));

const uploadMock = vi.fn();
const getPublicUrlMock = vi.fn();
const storageFromMock = vi.fn(() => ({ upload: uploadMock, getPublicUrl: getPublicUrlMock }));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({ storage: { from: storageFromMock } }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  subscribeMock.mockReset();
  createFalClientSpy.mockClear();
  uploadMock.mockReset();
  getPublicUrlMock.mockReset();
  storageFromMock.mockClear();
  uploadMock.mockResolvedValue({ error: null });
  getPublicUrlMock.mockReturnValue({ data: { publicUrl: 'https://cdn.example/public.bin' } });
  globalThis.fetch = vi.fn(
    async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 }),
  ) as unknown as typeof fetch;
});

// ── generateMomentStill ───────────────────────────────────────────────────────

describe('generateMomentStill', () => {
  it('returns the public storage URL and passes the prompt through verbatim', async () => {
    subscribeMock.mockResolvedValue({ data: { images: [{ url: 'https://fal.cdn/s.jpg' }] } });
    const { generateMomentStill } = await import('./media');
    const url = await generateMomentStill('a single hammered ring on black', {
      subdomain: 'ore-and-ash',
      aspect: '16:9',
    });
    expect(url).toBe('https://cdn.example/public.bin');
    expect(createFalClientSpy).toHaveBeenCalledWith({ credentials: 'fal-test-key' });
    const [, opts] = subscribeMock.mock.calls[0]!;
    // The prompt is Bohdi's — not wrapped or rewritten by us.
    expect(opts.input.prompt).toBe('a single hammered ring on black');
    expect(opts.input.image_size).toBe('landscape_16_9');
  });

  it('maps a square aspect to square_hd', async () => {
    subscribeMock.mockResolvedValue({ data: { images: [{ url: 'https://fal.cdn/s.jpg' }] } });
    const { generateMomentStill } = await import('./media');
    await generateMomentStill('x', { subdomain: 'sub', aspect: '1:1' });
    const [, opts] = subscribeMock.mock.calls[0]!;
    expect(opts.input.image_size).toBe('square_hd');
  });

  it('returns null when the SDK throws', async () => {
    subscribeMock.mockRejectedValue(new Error('rate limited'));
    const { generateMomentStill } = await import('./media');
    expect(await generateMomentStill('x', { subdomain: 'sub' })).toBeNull();
  });
});

// ── generateMomentVideo ───────────────────────────────────────────────────────

describe('generateMomentVideo', () => {
  it('calls Seedance 2.0 with the prompt, 720p, 16:9, and audio off, and returns the stored URL', async () => {
    subscribeMock.mockResolvedValue({ data: { video: { url: 'https://fal.cdn/clip.mp4' } } });
    const { generateMomentVideo, SEEDANCE_VIDEO_MODEL } = await import('./media');
    const url = await generateMomentVideo('a candle flame flickering, locked camera', {
      subdomain: 'ember-and-oak',
      aspect: '16:9',
    });
    expect(url).toBe('https://cdn.example/public.bin');
    const [model, opts] = subscribeMock.mock.calls[0]!;
    expect(model).toBe(SEEDANCE_VIDEO_MODEL);
    expect(SEEDANCE_VIDEO_MODEL).toBe('bytedance/seedance-2.0/fast/text-to-video');
    expect(opts.input.prompt).toBe('a candle flame flickering, locked camera');
    expect(opts.input.resolution).toBe('720p');
    expect(opts.input.aspect_ratio).toBe('16:9');
    expect(opts.input.generate_audio).toBe(false);
  });

  it('defaults to a 4-second clip and clamps to Seedance valid range (4-15)', async () => {
    subscribeMock.mockResolvedValue({ data: { video: { url: 'https://fal.cdn/c.mp4' } } });
    const { generateMomentVideo } = await import('./media');
    // default → "4" (Seedance's minimum; shorter is cheaper and enough for a
    // held atmospheric loop)
    await generateMomentVideo('x', { subdomain: 'sub' });
    expect(subscribeMock.mock.calls[0]![1].input.duration).toBe('4');
    // 10 passes through
    await generateMomentVideo('x', { subdomain: 'sub', durationSec: 10 });
    expect(subscribeMock.mock.calls[1]![1].input.duration).toBe('10');
    // out of range clamps into 4..15
    await generateMomentVideo('x', { subdomain: 'sub', durationSec: 99 });
    expect(subscribeMock.mock.calls[2]![1].input.duration).toBe('15');
    await generateMomentVideo('x', { subdomain: 'sub', durationSec: 1 });
    expect(subscribeMock.mock.calls[3]![1].input.duration).toBe('4');
  });

  it('returns null when the response carries no video', async () => {
    subscribeMock.mockResolvedValue({ data: {} });
    const { generateMomentVideo } = await import('./media');
    expect(await generateMomentVideo('x', { subdomain: 'sub' })).toBeNull();
  });

  it('returns null when the SDK throws', async () => {
    subscribeMock.mockRejectedValue(new Error('boom'));
    const { generateMomentVideo } = await import('./media');
    expect(await generateMomentVideo('x', { subdomain: 'sub' })).toBeNull();
  });
});

describe('moment media AbortSignal wiring', () => {
  it('threads the withTimeout signal to fal.subscribe as abortSignal for stills', async () => {
    subscribeMock.mockResolvedValue({ data: { images: [{ url: 'https://fal.cdn/s.jpg' }] } });
    const { generateMomentStill } = await import('./media');
    await generateMomentStill('x', { subdomain: 'sub' });
    const [, opts] = subscribeMock.mock.calls[0]! as [string, { abortSignal?: AbortSignal }];
    expect(opts.abortSignal).toBeInstanceOf(AbortSignal);
  });

  it('threads the withTimeout signal to fal.subscribe as abortSignal for videos (Seedance clips can take minutes — a stalled call MUST be cancelable)', async () => {
    subscribeMock.mockResolvedValue({ data: { video: { url: 'https://fal.cdn/c.mp4' } } });
    const { generateMomentVideo } = await import('./media');
    await generateMomentVideo('x', { subdomain: 'sub' });
    const [, opts] = subscribeMock.mock.calls[0]! as [string, { abortSignal?: AbortSignal }];
    expect(opts.abortSignal).toBeInstanceOf(AbortSignal);
  });
});
