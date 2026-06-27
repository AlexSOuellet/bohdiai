import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MediaJob } from '@/lib/archetypes/builder';
import type { PortableStore } from '@/lib/archetypes/portable';

// --- Mocked seams ----------------------------------------------------------
// supabaseAdmin: a per-table response map driven by `dbResponses`.
let dbResponses: Record<string, { data: unknown; error?: unknown }> = {};
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: (table: string) => {
      const resp = dbResponses[table] ?? { data: null };
      const chain = {
        select: () => chain,
        eq: () => chain,
        single: async () => resp,
        maybeSingle: async () => resp,
      };
      return chain;
    },
  }),
}));

// archetypeSpec: a registry keyed by `specs`.
const specs: Record<string, unknown> = {};
vi.mock('@/lib/archetypes/registry', () => ({
  archetypeSpec: (key: string) => specs[key],
}));

const authorFromPortableMock = vi.fn((..._a: unknown[]) => Promise.resolve({ authored: true }));
vi.mock('./author-from-portable', () => ({
  authorFromPortable: (...a: unknown[]) => authorFromPortableMock(...a),
}));

const writeVersionMock = vi.fn((..._a: unknown[]) => Promise.resolve());
vi.mock('./write-version', () => ({
  writeVersion: (...a: unknown[]) => writeVersionMock(...a),
}));

const genVideo = vi.fn(async () => 'http://x/video.mp4');
const genStill = vi.fn(async () => 'http://x/still.jpg');
vi.mock('@/lib/moments/media', () => ({
  generateMomentVideo: (...a: unknown[]) => genVideo(...(a as [])),
  generateMomentStill: (...a: unknown[]) => genStill(...(a as [])),
}));

import { partitionMedia, convertStore } from './convert';

// --- Fixtures --------------------------------------------------------------
function targetSpecWith(jobs: MediaJob[], looks = [{ key: 'looka' }, { key: 'lookb' }]) {
  return {
    key: 'the-find',
    looks,
    mediaJobs: () => jobs,
    applyMedia: (authored: unknown, urls: Record<string, string | null>) => ({ authored, urls }),
    toPayload: () => ({ content: { c: 1 }, products: [{ p: 1 }] }),
  };
}

function sourceSpecWith(portable: PortableStore) {
  return { key: 'main-street', handOff: () => portable };
}

function wireDb(opts: {
  tenant?: { data: unknown; error?: unknown };
  page?: { data: unknown };
  niche?: { data: unknown };
}) {
  dbResponses = {
    tenants: opts.tenant ?? {
      data: { id: 't1', primary_niche: 'candles', mood_key: 'cozy', business_name: 'B' },
    },
    content_pages: opts.page ?? {
      data: { layout_tree: { root: { kind: 'archetype', archetypeKey: 'main-street', content: { src: 1 } } } },
    },
    niches: opts.niche ?? { data: { display_name: 'Candles', body_markdown: 'body' } },
  };
}

const partitionJobs: MediaJob[] = [
  { id: 'hero', kind: 'still', prompt: 'a hero', aspect: '16:9', group: 'feature' },
  { id: 'portrait', kind: 'still', prompt: 'the maker', aspect: '1:1', group: 'feature' },
  { id: 'product:0', kind: 'still', prompt: 'p0', aspect: '1:1', group: 'product' },
  { id: 'product:1', kind: 'still', prompt: 'p1', aspect: '1:1', group: 'product' },
];

beforeEach(() => {
  dbResponses = {};
  for (const k of Object.keys(specs)) delete specs[k];
  authorFromPortableMock.mockClear();
  writeVersionMock.mockClear();
  genVideo.mockClear();
  genStill.mockClear();
});

describe('partitionMedia', () => {
  it('reuses the maker photo and source product photos; generates the rest', () => {
    const portable: PortableStore = {
      shopName: 'S',
      wordmark: 'S',
      maker: { photoUrl: 'http://x/maker.jpg' },
      products: [{ name: 'A', price: '$1', photoUrl: 'http://x/0.jpg' }, { name: 'B', price: '$2' }],
    };
    const { reuse, feature, product } = partitionMedia(partitionJobs, portable);
    expect(reuse['portrait']).toBe('http://x/maker.jpg');
    expect(reuse['product:0']).toBe('http://x/0.jpg');
    expect(feature.map((j) => j.id)).toEqual(['hero']); // portrait reused, not generated
    expect(product.map((j) => j.id)).toEqual(['product:1']); // product:0 reused
  });

  it('generates everything when the source carried no photos', () => {
    const portable: PortableStore = {
      shopName: 'S',
      wordmark: 'S',
      maker: {},
      products: [{ name: 'A', price: '$1' }, { name: 'B', price: '$2' }],
    };
    const { reuse, feature, product } = partitionMedia(partitionJobs, portable);
    expect(Object.keys(reuse)).toHaveLength(0);
    expect(feature.map((j) => j.id)).toEqual(['hero', 'portrait']);
    expect(product.map((j) => j.id)).toEqual(['product:0', 'product:1']);
  });

  it('routes a "maker"-id job to reuse and an unmatched product index to generate', () => {
    const jobs: MediaJob[] = [
      { id: 'maker', kind: 'still', prompt: 'm', aspect: '1:1', group: 'feature' },
      { id: 'product:5', kind: 'still', prompt: 'p5', aspect: '1:1', group: 'product' },
    ];
    const portable: PortableStore = {
      shopName: 'S',
      wordmark: 'S',
      maker: { photoUrl: 'http://x/m.jpg' },
      products: [{ name: 'A', price: '$1' }],
    };
    const { reuse, product } = partitionMedia(jobs, portable);
    expect(reuse['maker']).toBe('http://x/m.jpg');
    expect(product.map((j) => j.id)).toEqual(['product:5']); // index 5 has no source photo
  });
});

describe('convertStore', () => {
  it('re-expresses the live store as a version: reuses carry-over media, generates the rest, writes the envelope', async () => {
    const portable: PortableStore = {
      shopName: 'Evening Shadow',
      wordmark: 'Evening Shadow',
      maker: { photoUrl: 'http://x/maker.jpg' },
      products: [{ name: 'A', price: '$1', photoUrl: 'http://x/0.jpg' }, { name: 'B', price: '$2' }],
    };
    specs['main-street'] = sourceSpecWith(portable);
    specs['the-find'] = targetSpecWith([
      { id: 'hero', kind: 'video', prompt: 'h', aspect: '16:9', group: 'feature', durationSec: 6 },
      { id: 'portrait', kind: 'still', prompt: 'm', aspect: '1:1', group: 'feature' },
      { id: 'product:0', kind: 'still', prompt: 'p0', aspect: '1:1', group: 'product' },
      { id: 'product:1', kind: 'still', prompt: 'p1', aspect: '1:1', group: 'product' },
    ]);
    wireDb({});

    const result = await convertStore({
      subdomain: 'evening-shadow',
      targetArchetypeKey: 'the-find',
      label: 'find',
      lookKey: 'lookb',
    });

    expect(result).toEqual({
      tenantId: 't1',
      subdomain: 'evening-shadow',
      label: 'find',
      archetypeKey: 'the-find',
      lookKey: 'lookb', // valid look honored
    });
    // hero is a video (durationSec set), the un-reused product is a still; reused media not generated
    expect(genVideo).toHaveBeenCalledTimes(1);
    expect(genStill).toHaveBeenCalledTimes(1);
    const envelope = writeVersionMock.mock.calls[0]![2] as { mood: string; catalogSize: number; lookKey: string };
    expect(envelope.mood).toBe('cozy');
    expect(envelope.catalogSize).toBe(2);
    expect(envelope.lookKey).toBe('lookb');
  });

  it('falls back to the niche slug, mood key, and first look when those rows/inputs are missing', async () => {
    const portable: PortableStore = {
      shopName: 'S',
      wordmark: 'S',
      maker: {},
      products: [{ name: 'A', price: '$1' }],
    };
    specs['main-street'] = sourceSpecWith(portable);
    specs['the-find'] = targetSpecWith([{ id: 'hero', kind: 'video', prompt: 'h', aspect: '16:9', group: 'feature' }]);
    wireDb({
      tenant: { data: { id: 't9', primary_niche: 'mystery-craft', mood_key: 'not-a-mood', business_name: 'B' } },
      niche: { data: null }, // no niche row → fall back to the slug + empty body
    });

    const result = await convertStore({
      subdomain: 's',
      targetArchetypeKey: 'the-find',
      label: 'find',
      lookKey: 'nonexistent', // invalid → first look
    });

    expect(result.lookKey).toBe('looka');
    // video job with no durationSec still generates a video
    expect(genVideo).toHaveBeenCalledTimes(1);
    const brief = authorFromPortableMock.mock.calls[0]![1] as { nicheDisplayName: string; moodLabel: string };
    expect(brief.nicheDisplayName).toBe('mystery-craft');
    expect(brief.moodLabel).toBe('not-a-mood');
  });

  it('throws when the tenant is not found', async () => {
    wireDb({ tenant: { data: null, error: { message: 'nope' } } });
    await expect(
      convertStore({ subdomain: 'ghost', targetArchetypeKey: 'the-find', label: 'find' }),
    ).rejects.toThrow(/tenant not found/);
  });

  it('throws when the live store is not an archetype', async () => {
    wireDb({ page: { data: { layout_tree: { root: { kind: 'legacy' } } } } });
    await expect(
      convertStore({ subdomain: 's', targetArchetypeKey: 'the-find', label: 'find' }),
    ).rejects.toThrow(/not an archetype/);
  });

  it('throws when the source archetype has no handOff', async () => {
    specs['main-street'] = { key: 'main-street' }; // no handOff
    wireDb({});
    await expect(
      convertStore({ subdomain: 's', targetArchetypeKey: 'the-find', label: 'find' }),
    ).rejects.toThrow(/no handOff/);
  });

  it('throws when the target archetype is unknown', async () => {
    specs['main-street'] = sourceSpecWith({ shopName: 'S', wordmark: 'S', maker: {}, products: [] });
    wireDb({});
    await expect(
      convertStore({ subdomain: 's', targetArchetypeKey: 'ghost-archetype', label: 'find' }),
    ).rejects.toThrow(/unknown target/);
  });
});
