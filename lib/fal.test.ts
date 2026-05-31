import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock SDK + helpers ────────────────────────────────────────────────────────

const subscribeMock = vi.fn();
const createFalClientSpy = vi.fn(() => ({ subscribe: subscribeMock }));

vi.mock('@fal-ai/client', () => ({
  createFalClient: (...args: unknown[]) => createFalClientSpy(...(args as [])),
}));

vi.mock('@/lib/env', () => ({
  serverEnv: () => ({ FAL_API_KEY: 'fal-test-key' }),
}));

// Mock supabaseAdmin storage. Each test can override these.
const uploadMock = vi.fn();
const getPublicUrlMock = vi.fn();
const storageFromMock = vi.fn(() => ({
  upload: uploadMock,
  getPublicUrl: getPublicUrlMock,
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({ storage: { from: storageFromMock } }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// name-gender: keep real personPhrase logic so prompt strings build.
// (We don't need to mock it — it's pure.)

beforeEach(() => {
  subscribeMock.mockReset();
  createFalClientSpy.mockClear();
  uploadMock.mockReset();
  getPublicUrlMock.mockReset();
  storageFromMock.mockClear();
  // Default happy-path stubs.
  uploadMock.mockResolvedValue({ error: null });
  getPublicUrlMock.mockReturnValue({ data: { publicUrl: 'https://cdn.example/public.jpg' } });
  // Default fetch mock — successful image download.
  globalThis.fetch = vi.fn(
    async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 }),
  ) as unknown as typeof fetch;
});

// ── generateProductImage ──────────────────────────────────────────────────────

describe('generateProductImage', () => {
  it('returns the public storage URL on the happy path and uses the standard prompt', async () => {
    subscribeMock.mockResolvedValue({ data: { images: [{ url: 'https://fal.cdn/img.jpg' }] } });
    const { generateProductImage } = await import('./fal');
    const url = await generateProductImage(
      'Beeswax Candle',
      'A warm taper.',
      'Candles',
      'sub',
      'beeswax',
    );
    expect(url).toBe('https://cdn.example/public.jpg');
    expect(createFalClientSpy).toHaveBeenCalledWith({ credentials: 'fal-test-key' });
    // Standard product prompt path (not low-control).
    const [, opts] = subscribeMock.mock.calls[0]!;
    expect(opts.input.prompt).toMatch(/Professional product photography/);
    expect(opts.input.image_size).toBe('square_hd');
  });

  it('uses the low-control prompt when niche=leatherworker and mood=dark', async () => {
    subscribeMock.mockResolvedValue({ data: { images: [{ url: 'https://fal.cdn/x.jpg' }] } });
    const { generateProductImage } = await import('./fal');
    await generateProductImage('Wallet', 'Bridle leather.', 'Leatherworker', 'sub', 'w', {
      nicheSlug: 'leatherworker',
      moodKey: 'dark',
      moodLabel: 'Brooding',
    });
    const [, opts] = subscribeMock.mock.calls[0]!;
    expect(opts.input.prompt).toMatch(/^Product photography of Wallet/);
    expect(opts.input.prompt).toMatch(/Mood: Brooding/);
  });

  it('returns null when the SDK throws', async () => {
    subscribeMock.mockRejectedValue(new Error('rate limited'));
    const { generateProductImage } = await import('./fal');
    const url = await generateProductImage('X', 'Y', 'Niche', 'sub', 'slug');
    expect(url).toBeNull();
  });

  it('returns null when the fal call stalls past the timeout instead of hanging', async () => {
    const { generateProductImage, FAL_IMAGE_TIMEOUT_MS } = await import('./fal');
    vi.useFakeTimers();
    try {
      subscribeMock.mockReturnValue(new Promise(() => {})); // never settles
      const pending = generateProductImage('X', 'Y', 'Niche', 'sub', 'slug');
      await vi.advanceTimersByTimeAsync(FAL_IMAGE_TIMEOUT_MS + 1000);
      await expect(pending).resolves.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('returns null when the SDK response has no images', async () => {
    subscribeMock.mockResolvedValue({ data: { images: [] } });
    const { generateProductImage } = await import('./fal');
    const url = await generateProductImage('X', 'Y', 'Niche', 'sub', 'slug');
    expect(url).toBeNull();
  });

  it('falls back to the direct fal URL when fetch fails to download', async () => {
    subscribeMock.mockResolvedValue({ data: { images: [{ url: 'https://fal.cdn/d.jpg' }] } });
    globalThis.fetch = vi.fn(
      async () => new Response(null, { status: 500 }),
    ) as unknown as typeof fetch;
    const { generateProductImage } = await import('./fal');
    const url = await generateProductImage('X', 'Y', 'Niche', 'sub', 'slug');
    expect(url).toBe('https://fal.cdn/d.jpg');
  });

  it('falls back to the direct fal URL when Supabase storage upload fails', async () => {
    subscribeMock.mockResolvedValue({ data: { images: [{ url: 'https://fal.cdn/u.jpg' }] } });
    uploadMock.mockResolvedValue({ error: { message: 'bucket missing' } });
    const { generateProductImage } = await import('./fal');
    const url = await generateProductImage('X', 'Y', 'Niche', 'sub', 'slug');
    expect(url).toBe('https://fal.cdn/u.jpg');
  });
});

// ── generateHeroImage ─────────────────────────────────────────────────────────

describe('generateHeroImage', () => {
  it('uses the editorial lifestyle prompt and landscape size by default', async () => {
    subscribeMock.mockResolvedValue({ data: { images: [{ url: 'https://fal.cdn/h.jpg' }] } });
    const { generateHeroImage } = await import('./fal');
    const url = await generateHeroImage('Candles', 'sub');
    expect(url).toBe('https://cdn.example/public.jpg');
    const [, opts] = subscribeMock.mock.calls[0]!;
    expect(opts.input.prompt).toMatch(/Editorial lifestyle photography/);
    expect(opts.input.image_size).toBe('landscape_16_9');
  });

  it('uses the low-control hero prompt for leatherworker/dark', async () => {
    subscribeMock.mockResolvedValue({ data: { images: [{ url: 'https://fal.cdn/h2.jpg' }] } });
    const { generateHeroImage } = await import('./fal');
    await generateHeroImage('Leather', 'sub', {
      nicheSlug: 'leatherworker',
      moodKey: 'dark',
      moodLabel: 'Brooding',
      gender: 'male',
    });
    const [, opts] = subscribeMock.mock.calls[0]!;
    expect(opts.input.prompt).toMatch(/working in/);
    expect(opts.input.prompt).toMatch(/Mood: Brooding/);
  });
});

// ── generateAboutImage ────────────────────────────────────────────────────────

describe('generateAboutImage', () => {
  it('uses the editorial documentary portrait prompt and square_hd size by default', async () => {
    subscribeMock.mockResolvedValue({ data: { images: [{ url: 'https://fal.cdn/a.jpg' }] } });
    const { generateAboutImage } = await import('./fal');
    const url = await generateAboutImage('Candles', 'sub');
    expect(url).toBe('https://cdn.example/public.jpg');
    const [, opts] = subscribeMock.mock.calls[0]!;
    expect(opts.input.prompt).toMatch(/Editorial documentary portrait/);
    expect(opts.input.image_size).toBe('square_hd');
  });

  it('uses the low-control about prompt for leatherworker/dark and female default', async () => {
    subscribeMock.mockResolvedValue({ data: { images: [{ url: 'https://fal.cdn/a2.jpg' }] } });
    const { generateAboutImage } = await import('./fal');
    await generateAboutImage('Leather', 'sub', {
      nicheSlug: 'leatherworker',
      moodKey: 'dark',
      moodLabel: 'Brooding',
    });
    const [, opts] = subscribeMock.mock.calls[0]!;
    expect(opts.input.prompt).toMatch(/^Portrait of/);
    expect(opts.input.prompt).toMatch(/Mood: Brooding/);
  });
});
