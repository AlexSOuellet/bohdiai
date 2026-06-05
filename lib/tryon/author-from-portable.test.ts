import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/anthropic', () => ({
  anthropicClient: () => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        stop_reason: 'tool_use',
        content: [{ type: 'tool_use', id: 't1', name: 'submit_store', input: { content: { ok: 1 } } }],
      }),
    },
  }),
}));

import { authorFromPortable, portableBlock } from './author-from-portable';
import type { ArchetypeBuildSpec } from '@/lib/archetypes/builder';

const fakeSpec = {
  key: 'fake',
  authoringSpec: () => 'AUTHOR THIS',
  parseSubmission: (raw: unknown) => ({ ok: true as const, authored: raw }),
} as unknown as ArchetypeBuildSpec;

describe('authorFromPortable', () => {
  it('returns the authored result once parseSubmission passes', async () => {
    const out = await authorFromPortable(
      fakeSpec,
      { shopName: 'S', nicheDisplayName: 'n', nicheBody: '', moodLabel: 'm', moodDescription: '', productCount: 2 },
      { shopName: 'S', wordmark: 'S', maker: {}, products: [{ name: 'A', price: '$1' }] },
    );
    expect(out).toEqual({ content: { ok: 1 } });
  });
});

describe('portableBlock', () => {
  it('lists every product name and price for Bohdi to reuse', () => {
    const block = portableBlock({
      shopName: 'S',
      wordmark: 'Shop',
      tagline: 'a voice',
      maker: { body: 'a story' },
      products: [{ name: 'Beanie', price: '$34' }, { name: 'Tote', price: '$58' }],
    });
    expect(block).toContain('Beanie — $34');
    expect(block).toContain('Tote — $58');
    expect(block).toContain('a story');
  });
});
