import { describe, it, expect, vi, beforeEach } from 'vitest';

const create = vi.fn();
vi.mock('@/lib/anthropic', () => ({ anthropicClient: () => ({ messages: { create } }) }));

import { authorStore } from './build-archetype-store';
import type { AuthoringBrief } from '@/lib/archetypes/builder';

const brief: AuthoringBrief = {
  shopName: 'Tannery Row',
  nicheDisplayName: 'Leatherworker',
  nicheBody: 'Leatherworkers cut full-grain hides and saddle-stitch by hand.',
  moodLabel: 'rustic',
  moodDescription: 'warm and worn',
  productCount: 3,
};

// A minimal valid Main Street submission (content + 3 products).
const draft = {
  content: {
    shopName: 'Tannery Row',
    identity: { wordmark: 'Tannery Row', nav: ['Shop', 'About'] },
    moment: {
      media: {
        kind: 'image',
        prompt: { composition: 'bench', subject: 'a wallet', environment: 'a workshop', atmosphere: 'warm', camera: 'still', lighting: 'amber', style: 'photographic' },
        alt: 'the bench',
      },
      story: ['cut by hand', 'stitched to last'],
      eyebrow: 'Made in the workshop',
      brand: 'Tannery Row',
      ctaLabel: 'See the work',
    },
    goods: { title: 'The bench', treatment: 'procession' },
    founder: {
      quote: 'I would rather make one belt that lasts thirty years than ten that do not at all.',
      attribution: 'Sam, founder',
      photo: { prompt: 'the maker at the bench with a knife roll', alt: 'the maker' },
    },
    close: { label: 'Come by', headline: 'Built to outlast us', ctaLabel: 'Order yours' },
  },
  products: [
    { name: 'Belt', slug: 'belt', shortDescription: 'A full-grain belt', description: 'A belt cut from one hide.', basePriceCents: 9800, imagePrompt: 'a belt on wood' },
    { name: 'Wallet', slug: 'wallet', shortDescription: 'A bifold', description: 'Saddle-stitched bifold.', basePriceCents: 6800, imagePrompt: 'a wallet on stone' },
    { name: 'Tote', slug: 'tote', shortDescription: 'A tote', description: 'A roomy tote.', basePriceCents: 22000, imagePrompt: 'a tote on a bench' },
  ],
};

let counter = 0;
function toolMsg(name: string, input: unknown) {
  counter += 1;
  return { content: [{ type: 'tool_use', id: `t_${name}_${counter}`, name, input }], stop_reason: 'tool_use' };
}

beforeEach(() => {
  create.mockReset();
  counter = 0;
});

describe('authorStore (single pass)', () => {
  it('accepts the first valid submission and returns it — no second deepen round', async () => {
    create
      .mockResolvedValueOnce(toolMsg('choose_format', { archetypeKey: 'main-street', lookKey: 'main-street-ember' }))
      .mockResolvedValueOnce(toolMsg('submit_store', draft));
    const { authored } = await authorStore(brief);
    expect((authored as typeof draft).content.moment.eyebrow).toBe('Made in the workshop');
    expect(create).toHaveBeenCalledTimes(2); // choose, submit — and that's it
  });

  it('throws if Bohdi ends the turn without ever submitting a valid store', async () => {
    create
      .mockResolvedValueOnce(toolMsg('choose_format', { archetypeKey: 'main-street', lookKey: 'main-street-ember' }))
      .mockResolvedValue({ content: [{ type: 'text', text: 'all set' }], stop_reason: 'end_turn' });
    await expect(authorStore(brief)).rejects.toThrow(/without submitting/);
  });
});
