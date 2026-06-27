import { describe, it, expect, vi, beforeEach } from 'vitest';

const createMock = vi.fn();
vi.mock('@/lib/anthropic', () => ({
  anthropicClient: () => ({ messages: { create: createMock } }),
}));

import { authorFromPortable, portableBlock } from './author-from-portable';
import type { ArchetypeBuildSpec } from '@/lib/archetypes/builder';
import type { PortableStore } from '@/lib/archetypes/portable';

const brief = { shopName: 'S', nicheDisplayName: 'n', nicheBody: '', moodLabel: 'm', moodDescription: '', productCount: 2 };
const portable: PortableStore = { shopName: 'S', wordmark: 'S', maker: {}, products: [{ name: 'A', price: '$1' }] };

function specWith(parse: (raw: unknown) => unknown): ArchetypeBuildSpec {
  return { key: 'fake', authoringSpec: () => 'AUTHOR THIS', parseSubmission: parse } as unknown as ArchetypeBuildSpec;
}

const toolUseResp = {
  stop_reason: 'tool_use',
  content: [{ type: 'tool_use', id: 't1', name: 'submit_store', input: { content: { ok: 1 } } }],
};

beforeEach(() => createMock.mockReset());

describe('authorFromPortable', () => {
  it('returns the authored result once parseSubmission passes', async () => {
    createMock.mockResolvedValue(toolUseResp);
    const out = await authorFromPortable(specWith((raw) => ({ ok: true, authored: raw })), brief, portable);
    expect(out).toEqual({ content: { ok: 1 } });
  });

  it('feeds back issues and resubmits when the first submission is rejected', async () => {
    createMock.mockResolvedValue(toolUseResp);
    let call = 0;
    const out = await authorFromPortable(
      specWith(() => (call++ === 0 ? { ok: false, issues: ['fix this'] } : { ok: true, authored: { fixed: true } })),
      brief,
      portable,
    );
    expect(out).toEqual({ fixed: true });
    expect(createMock).toHaveBeenCalledTimes(2); // rejected, then resubmitted
  });

  it('throws when the model ends its turn without submitting', async () => {
    createMock.mockResolvedValue({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'no tool' }] });
    await expect(authorFromPortable(specWith(() => ({ ok: true })), brief, portable)).rejects.toThrow(
      /ended without submitting/,
    );
  });

  it('keeps going past a non-end_turn no-tool reply, then throws after the turn budget', async () => {
    createMock.mockResolvedValue({ stop_reason: 'max_tokens', content: [] });
    await expect(authorFromPortable(specWith(() => ({ ok: true })), brief, portable)).rejects.toThrow(
      /no valid submission/,
    );
    expect(createMock).toHaveBeenCalledTimes(8); // MAX_TURNS
  });
});

describe('portableBlock', () => {
  it('lists every product name and price, and folds in a product description when present', () => {
    const block = portableBlock({
      shopName: 'S',
      wordmark: 'Shop',
      tagline: 'a voice',
      maker: { body: 'a story' },
      products: [{ name: 'Beanie', price: '$34', description: 'merino wool' }, { name: 'Tote', price: '$58' }],
    });
    expect(block).toContain('Beanie — $34 (merino wool)'); // description branch
    expect(block).toContain('Tote — $58');
    expect(block).toContain('a story');
  });

  it('omits the optional tagline and maker story when the portable store lacks them', () => {
    const block = portableBlock({ shopName: 'S', wordmark: 'Shop', maker: {}, products: [{ name: 'X', price: '$1' }] });
    expect(block).not.toContain('Tagline / voice');
    expect(block).not.toContain('Maker story');
  });
});
