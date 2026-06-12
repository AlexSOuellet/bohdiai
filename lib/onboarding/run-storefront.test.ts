import { describe, it, expect, vi, beforeEach } from 'vitest';

// One engine: runStorefront forwards every niche to the archetype build path.
const buildMock = vi.fn();
vi.mock('./build-archetype-store', () => ({
  buildArchetypeStore: (...args: unknown[]) => buildMock(...args),
}));

beforeEach(() => {
  buildMock.mockReset();
  buildMock.mockResolvedValue({ tenantId: 't1', subdomain: 'sub' });
});

const baseInput = {
  shopName: 'Test Shop',
  subdomain: 'sub',
  nicheSlug: 'leatherworker',
  moodKey: 'rustic' as const,
  productCount: 8,
};

describe('runStorefront', () => {
  it('routes every niche through the archetype engine', async () => {
    const { runStorefront } = await import('./run-storefront');
    const result = await runStorefront(baseInput);
    expect(buildMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ tenantId: 't1', subdomain: 'sub' });
  });

  it('forwards the build input and the progress emitter', async () => {
    const emitter = vi.fn();
    const { runStorefront } = await import('./run-storefront');
    await runStorefront({ ...baseInput, makerName: 'Sam', logoUrl: 'https://logo' }, emitter);
    const [passedInput, passedEmitter] = buildMock.mock.calls[0]!;
    expect(passedInput).toMatchObject({
      shopName: 'Test Shop',
      subdomain: 'sub',
      nicheSlug: 'leatherworker',
      moodKey: 'rustic',
      productCount: 8,
      makerName: 'Sam',
      logoUrl: 'https://logo',
    });
    expect(passedEmitter).toBe(emitter);
  });

  it('passes brandColors into the build', async () => {
    const { runStorefront } = await import('./run-storefront');
    await runStorefront({ ...baseInput, brandColors: ['#1d7a66', '#e7d8b0'] });
    const [passedInput] = buildMock.mock.calls[0]!;
    expect(passedInput).toHaveProperty('brandColors', ['#1d7a66', '#e7d8b0']);
  });

  it('passes productPhotoUrls, visionPerPhoto, and makerWork into buildArchetypeStore', async () => {
    const { runStorefront } = await import('./run-storefront');
    await runStorefront({
      ...baseInput,
      productPhotoUrls: ['https://example.com/p1.jpg'],
      visionPerPhoto: [
        {
          productType: 'bowl',
          suggestedName: 'River Bowl',
          suggestedShortDescription: 'small bowl',
          suggestedDescription: 'A small bowl.',
          suggestedPriceCents: 4800,
        },
      ],
      makerWork: 'Turns small bowls.',
    });
    const [passedInput] = buildMock.mock.calls[0]!;
    expect(passedInput).toMatchObject({
      productPhotoUrls: ['https://example.com/p1.jpg'],
      makerWork: 'Turns small bowls.',
    });
    expect(passedInput).toHaveProperty('visionPerPhoto');
    expect((passedInput as { visionPerPhoto: Array<{ productType: string }> }).visionPerPhoto[0]).toMatchObject({
      productType: 'bowl',
    });
  });
});
