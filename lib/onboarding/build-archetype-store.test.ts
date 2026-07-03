import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recycleProductPhotos, prepareJobPrompt, buildArchetypeStore } from './build-archetype-store';
import type { MediaJob } from '@/lib/archetypes/builder';
import { generateMomentVideo, generateMomentStill } from '@/lib/moments/media';

// Stand-ins for the orchestrator's heavy neighbors, so the wiring test can run
// in memory with no DB, AI, or image calls. Each returns a value we control.
const single = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({ from: () => ({ select: () => ({ eq: () => ({ single }) }) }) }),
}));
const directAndProduce = vi.fn();
vi.mock('@/lib/onboarding/crew/pipeline', () => ({ directAndProduce: (b: unknown) => directAndProduce(b) }));
vi.mock('@/lib/moments/media', () => ({ generateMomentVideo: vi.fn(), generateMomentStill: vi.fn() }));
const writeArchetypeStorefront = vi.fn();
vi.mock('@/lib/generation/write-archetype-storefront', () => ({ writeArchetypeStorefront: (a: unknown) => writeArchetypeStorefront(a) }));
const logCrewChoices = vi.fn();
vi.mock('@/lib/onboarding/crew/log-choices', () => ({ logCrewChoices: (c: unknown) => logCrewChoices(c) }));

describe('prepareJobPrompt', () => {
  const base: MediaJob = { id: 'x', kind: 'still', prompt: 'a wallet on stone', aspect: '1:1', group: 'product' };

  it('adds photorealism to a product image and no person phrase', () => {
    const out = prepareJobPrompt(base, 'Abigail Stone');
    expect(out.toLowerCase()).toContain('photorealistic');
    expect(out.toLowerCase()).not.toContain('a woman');
  });

  it('frames a portrait gender-neutrally, never by a guessed gender (D42)', () => {
    const portrait: MediaJob = { ...base, id: 'portrait', prompt: 'the maker at the bench', subjectIsPerson: true };
    const out = prepareJobPrompt(portrait, 'Abigail Stone').toLowerCase();
    expect(out).not.toContain('a woman');
    expect(out).not.toContain('a man');
    expect(out).toContain('hands');
    expect(out).toContain('photorealistic');
  });
});

describe('recycleProductPhotos', () => {
  it('gives each product its own photo when there are enough', () => {
    const photos = ['a', 'b', 'c'];
    expect(recycleProductPhotos(3, photos)).toEqual(['a', 'b', 'c']);
  });

  it('recycles photos in order when products exceed the photo count', () => {
    const photos = ['a', 'b', 'c', 'd', 'e']; // the 5-image cap
    // 10 products, 5 photos → recycle
    expect(recycleProductPhotos(10, photos)).toEqual([
      'a', 'b', 'c', 'd', 'e', 'a', 'b', 'c', 'd', 'e',
    ]);
  });

  it('returns nulls when no photos generated', () => {
    expect(recycleProductPhotos(3, [])).toEqual([null, null, null]);
  });

  it('handles a single surviving photo', () => {
    expect(recycleProductPhotos(4, ['only'])).toEqual(['only', 'only', 'only', 'only']);
  });
});

describe('buildArchetypeStore — crew-choice logging seam', () => {
  // A minimal spec whose media step is empty, so no images are generated.
  const fakeSpec = {
    key: 'main-street',
    mediaJobs: () => [],
    applyMedia: (authored: unknown) => authored,
    toPayload: () => ({ content: {}, products: [] }),
  };

  beforeEach(() => {
    single.mockResolvedValue({ data: { display_name: 'Woodworking', body_markdown: 'x', tenant_type_fit: ['seller'] }, error: null });
    directAndProduce.mockResolvedValue({
      chosen: { spec: fakeSpec, lookKey: 'main-street-ember' },
      authored: {},
      choices: { heroKind: 'video', goodsTreatment: 'procession', founderTreatment: 'quote' },
    });
    // The publish step hands back a tenant id we chose — a match proves the
    // orchestrator passed THIS id through to the logger.
    writeArchetypeStorefront.mockResolvedValue({ subdomain: 'wally', tenantId: 'tn_real_123' });
    logCrewChoices.mockClear();
  });

  it('logs the crew picks against the real tenant id, niche, and mood after publishing', async () => {
    await buildArchetypeStore({
      shopName: "Wally's Wood",
      subdomain: 'wally',
      nicheSlug: 'woodworking',
      moodKey: 'rustic',
      productCount: 3,
    });

    expect(logCrewChoices).toHaveBeenCalledTimes(1);
    expect(logCrewChoices).toHaveBeenCalledWith({
      tenantId: 'tn_real_123', // from the publish step, not the input
      nicheSlug: 'woodworking',
      moodKey: 'rustic',
      heroKind: 'video',
      goodsTreatment: 'procession',
      founderTreatment: 'quote',
    });
  });
});

describe('buildArchetypeStore — find-us date stamping', () => {
  const applyMedia = vi.fn((authored: unknown) => authored);
  const fakeSpec = { key: 'main-street', mediaJobs: () => [], applyMedia, toPayload: () => ({ content: {}, products: [] }) };

  beforeEach(() => {
    single.mockReset().mockResolvedValue({ data: { display_name: 'Candles', body_markdown: 'x', tenant_type_fit: ['seller'] }, error: null });
    directAndProduce.mockReset();
    writeArchetypeStorefront.mockReset().mockResolvedValue({ subdomain: 'lumen', tenantId: 'tn_fu' });
    applyMedia.mockClear();
  });

  it('stamps real near-future ISO dates onto the seeded find-us rows before render (D45)', async () => {
    directAndProduce.mockResolvedValue({
      chosen: { spec: fakeSpec, lookKey: 'main-street-ember' },
      authored: {
        content: {
          founder: {
            findUs: {
              label: 'Find us',
              rows: [
                { day: 'someday', where: 'Providence Flea', time: '10–4', kind: 'market' },
                { day: 'someday', where: 'Hope St Market', time: '9–1' },
              ],
            },
          },
        },
      },
      choices: { heroKind: 'video', goodsTreatment: 'procession', founderTreatment: 'quote' },
    });

    await buildArchetypeStore({ shopName: 'Lumen', subdomain: 'lumen', nicheSlug: 'candles', moodKey: 'cozy', productCount: 3 });

    const authored = applyMedia.mock.calls[0]![0] as { content: { founder: { findUs: { rows: Array<{ date?: string; where: string }> } } } };
    const rows = authored.content.founder.findUs.rows;
    expect(rows[0]!.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // a real ISO date now
    expect(rows[0]!.where).toBe('Providence Flea'); // venue/kind untouched
    expect(rows[0]!.date! < rows[1]!.date!).toBe(true); // ascending
  });
});

describe('buildArchetypeStore — Other (describe-and-build)', () => {
  // A maker who picks "Other" types what they make; Bohdi builds from that
  // description alone — no niche file, no DB lookup, nothing saved as a niche.
  const fakeSpec = {
    key: 'main-street',
    mediaJobs: () => [],
    applyMedia: (authored: unknown) => authored,
    toPayload: () => ({ content: {}, products: [] }),
  };

  beforeEach(() => {
    single.mockReset();
    directAndProduce.mockReset();
    directAndProduce.mockResolvedValue({
      chosen: { spec: fakeSpec, lookKey: 'main-street-ember' },
      authored: {},
      choices: { heroKind: 'video', goodsTreatment: 'procession', founderTreatment: 'quote' },
    });
    writeArchetypeStorefront.mockReset();
    writeArchetypeStorefront.mockResolvedValue({ subdomain: 'planters', tenantId: 'tn_other_1' });
  });

  it('skips the niches table and feeds the typed description as the niche body', async () => {
    await buildArchetypeStore({
      shopName: 'Set Stone',
      subdomain: 'planters',
      nicheSlug: 'other',
      nicheDescription: 'I make hand-poured concrete planters with pressed botanicals',
      moodKey: 'modern',
      productCount: 3,
    });

    // No niche row exists for Other — the DB lookup must never run.
    expect(single).not.toHaveBeenCalled();
    // The crew receives the maker's own words as the niche material.
    const brief = directAndProduce.mock.calls[0]![0] as { nicheBody: string };
    expect(brief.nicheBody).toBe('I make hand-poured concrete planters with pressed botanicals');
  });

  it('persists as not-from-list with the description and no primary niche', async () => {
    await buildArchetypeStore({
      shopName: 'Set Stone',
      subdomain: 'planters',
      nicheSlug: 'other',
      nicheDescription: 'concrete planters with pressed botanicals',
      moodKey: 'modern',
      productCount: 3,
    });

    const writeArg = writeArchetypeStorefront.mock.calls[0]![0] as {
      nicheFromList: boolean;
      nicheDescription: string | null;
      primaryNiche: string | null;
    };
    expect(writeArg.nicheFromList).toBe(false);
    expect(writeArg.nicheDescription).toBe('concrete planters with pressed botanicals');
    expect(writeArg.primaryNiche).toBeNull();
  });
});

describe('buildArchetypeStore — media generation + niche fallbacks', () => {
  const applyMedia = vi.fn((authored: unknown, urls: Record<string, string | null>) => ({ authored, urls }));
  // 1 video + 1 portrait still (feature), 7 product stills (over the cap of 5).
  const jobs: MediaJob[] = [
    { id: 'hero', kind: 'video', prompt: 'h', aspect: '16:9', group: 'feature', durationSec: 6 },
    { id: 'portrait', kind: 'still', prompt: 'p', aspect: '1:1', group: 'feature', subjectIsPerson: true },
    ...Array.from({ length: 7 }, (_, i): MediaJob => ({
      id: `product:${i}`,
      kind: 'still',
      prompt: `pr${i}`,
      aspect: '1:1',
      group: 'product',
    })),
  ];
  const fakeSpec = { key: 'main-street', mediaJobs: () => jobs, applyMedia, toPayload: () => ({ content: {}, products: [] }) };

  beforeEach(() => {
    single.mockReset();
    directAndProduce.mockReset();
    writeArchetypeStorefront.mockReset();
    applyMedia.mockClear();
    vi.mocked(generateMomentVideo).mockReset().mockResolvedValue('vid');
    vi.mocked(generateMomentStill).mockReset().mockResolvedValue('still');
    directAndProduce.mockResolvedValue({
      chosen: { spec: fakeSpec, lookKey: 'main-street-ember' },
      authored: {},
      choices: { heroKind: 'video', goodsTreatment: 'procession', founderTreatment: 'quote' },
    });
    writeArchetypeStorefront.mockResolvedValue({ subdomain: 'wally', tenantId: 'tn_1' });
  });

  it('generates a video for the video job, stills for the rest (capped at 5 products), and recycles photos across all slots', async () => {
    single.mockResolvedValue({ data: { display_name: 'Wood', body_markdown: 'b', tenant_type_fit: ['seller'] }, error: null });

    await buildArchetypeStore({ shopName: 'W', subdomain: 'wally', nicheSlug: 'woodworking', moodKey: 'rustic', productCount: 7 });

    // one video job; portrait + 5 (capped) product stills = 6 stills
    expect(vi.mocked(generateMomentVideo)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(generateMomentVideo).mock.calls[0]![1]).toMatchObject({ durationSec: 6 });
    expect(vi.mocked(generateMomentStill)).toHaveBeenCalledTimes(6);

    const urls = applyMedia.mock.calls[0]![1];
    expect(urls['hero']).toBe('vid');
    expect(urls['portrait']).toBe('still');
    // all 7 product slots filled by recycling the 5 generated photos
    expect(urls['product:6']).toBe('still');
    expect(Object.keys(urls).filter((k) => k.startsWith('product:'))).toHaveLength(7);
  });

  it('falls back to empty niche body and seller-only tenant types when those columns are null', async () => {
    single.mockResolvedValue({ data: { display_name: 'Wood', body_markdown: null, tenant_type_fit: null }, error: null });

    await buildArchetypeStore({ shopName: 'W', subdomain: 'wally', nicheSlug: 'woodworking', moodKey: 'rustic', productCount: 1 });

    const brief = directAndProduce.mock.calls[0]![0] as { nicheBody: string };
    expect(brief.nicheBody).toBe('');
    const writeArg = writeArchetypeStorefront.mock.calls[0]![0] as { tenantTypes: string[] };
    expect(writeArg.tenantTypes).toEqual(['seller']);
  });

  it('throws when a list niche is not found', async () => {
    single.mockResolvedValue({ data: null, error: { message: 'no row' } });
    await expect(
      buildArchetypeStore({ shopName: 'W', subdomain: 'wally', nicheSlug: 'ghost', moodKey: 'rustic', productCount: 1 }),
    ).rejects.toThrow(/Niche not found: ghost/);
  });
});
