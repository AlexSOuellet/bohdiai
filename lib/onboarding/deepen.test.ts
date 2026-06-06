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
const deepened = {
  ...draft,
  content: { ...draft.content, moment: { ...draft.content.moment, eyebrow: 'Saddle-stitched in the workshop' } },
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

describe('authorStore deepen pass', () => {
  it('runs one deepen round and returns the deepened draft', async () => {
    create
      .mockResolvedValueOnce(toolMsg('choose_format', { archetypeKey: 'main-street', lookKey: 'main-street-ember' }))
      .mockResolvedValueOnce(toolMsg('submit_store', draft))
      .mockResolvedValueOnce(toolMsg('submit_store', deepened));
    const { authored } = await authorStore(brief);
    expect((authored as typeof draft).content.moment.eyebrow).toBe('Saddle-stitched in the workshop');
    expect(create).toHaveBeenCalledTimes(3); // choose, draft, deepened
  });

  it('falls back to the first valid draft if the deepen round never yields a valid resubmit', async () => {
    create
      .mockResolvedValueOnce(toolMsg('choose_format', { archetypeKey: 'main-street', lookKey: 'main-street-ember' }))
      .mockResolvedValueOnce(toolMsg('submit_store', draft))
      .mockResolvedValue({ content: [{ type: 'text', text: 'no change needed' }], stop_reason: 'end_turn' });
    const { authored } = await authorStore(brief);
    expect((authored as typeof draft).content.moment.eyebrow).toBe('Made in the workshop');
  });
});
