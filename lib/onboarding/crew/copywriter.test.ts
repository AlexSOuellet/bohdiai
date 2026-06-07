import { describe, it, expect, vi, beforeEach } from 'vitest';

const create = vi.fn();
vi.mock('@/lib/anthropic', () => ({ anthropicClient: () => ({ messages: { create } }) }));

import { writeCopy } from './copywriter';
import { CopywriterDraftSchema } from './copywriter-schema';
import type { Trajectory } from './trajectory';
import type { CrewBrief } from './types';

const brief: CrewBrief = {
  shopName: 'Tannery Row',
  nicheDisplayName: 'Leatherworker',
  nicheBody: 'People buy leather goods that outlast them and carry a story.',
  moodLabel: 'Rustic',
  moodDescription: 'warm and worn',
  productCount: 3,
  moodKey: 'rustic',
};

const trajectory: Trajectory = {
  feeling: 'the quiet pride of carrying something built to outlast you',
  customerWhy: 'people want one good thing that ages with them, not another that wears out',
  visualWorld: 'warm and worn, low light, deep shadow, rich texture',
  momentConcept: 'a hand resting on a worn bench, dust drifting in a slow shaft of light',
  register: 'restrained',
};

// A minimal valid words-only draft (no image prompts; treatments chosen).
const draft = {
  shopName: 'Tannery Row',
  identity: { wordmark: 'Tannery Row', nav: ['Shop', 'About'] },
  moment: {
    story: ['Built by hand', 'Made to outlast you'],
    eyebrow: 'From the workshop',
    brand: 'Tannery Row',
    ctaLabel: 'See the work',
  },
  goods: { title: 'The bench', treatment: 'procession' },
  founder: {
    quote: 'I would rather make one belt that lasts thirty years than ten that fall apart.',
    attribution: 'Sam, founder',
    treatment: 'quote',
  },
  close: { label: 'Come by', headline: 'Built to outlast us', ctaLabel: 'Order yours' },
  about: {
    heading: 'The story',
    story: [
      'We started at a single bench with a knife and more patience than sense, and that has not changed much.',
      'Everything here is meant to be used hard and handed down, the way good things always were.',
    ],
  },
  contact: { heading: 'Say hello', intro: 'We read everything that comes in and we would love to hear what you are looking for.' },
  products: [
    { name: 'Belt', slug: 'belt', shortDescription: 'A belt for life', description: 'A belt that ages with you and never lets go.', basePriceCents: 9800 },
    { name: 'Wallet', slug: 'wallet', shortDescription: 'An everyday bifold', description: 'A bifold that gets better the longer you carry it.', basePriceCents: 6800 },
    { name: 'Tote', slug: 'tote', shortDescription: 'A roomy tote', description: 'A tote that carries the week and softens with it.', basePriceCents: 22000 },
  ],
};

function toolMsg(input: unknown) {
  return { content: [{ type: 'tool_use', id: 't_copy', name: 'submit_copy', input }], stop_reason: 'tool_use' };
}

beforeEach(() => {
  create.mockReset();
});

describe('writeCopy (the Copywriter)', () => {
  it('returns the validated words-only draft from a valid first call', async () => {
    create.mockResolvedValueOnce(toolMsg(draft));
    const d = await writeCopy(brief, trajectory);
    expect(d.shopName).toBe('Tannery Row');
    expect(d.goods.treatment).toBe('procession');
    expect(d.founder.treatment).toBe('quote');
    expect(d.products).toHaveLength(3);
    expect(CopywriterDraftSchema.safeParse(d).success).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('puts the trajectory in the prompt and forces the tool', async () => {
    create.mockResolvedValueOnce(toolMsg(draft));
    await writeCopy(brief, trajectory);
    const args = create.mock.calls[0]![0] as { system: string; tool_choice?: unknown };
    expect(args.system).toContain(trajectory.feeling);
    expect(args.system).toContain(trajectory.customerWhy);
    expect(args.tool_choice).toEqual({ type: 'tool', name: 'submit_copy' });
  });

  it('rejects a story line with punctuation, then accepts the fix', async () => {
    const bad = { ...draft, moment: { ...draft.moment, story: ['Flour. Water. Salt.', 'Time'] } };
    create.mockResolvedValueOnce(toolMsg(bad)).mockResolvedValueOnce(toolMsg(draft));
    const d = await writeCopy(brief, trajectory);
    expect(d.moment.story).toEqual(['Built by hand', 'Made to outlast you']);
    expect(create).toHaveBeenCalledTimes(2);
    const second = create.mock.calls[1]![0] as { messages: Array<{ role: string; content: unknown }> };
    expect(JSON.stringify(second.messages.at(-1))).toContain('punctuation');
  });

  it('throws when no valid copy is produced within the attempt cap', async () => {
    create.mockResolvedValue(toolMsg({ ...draft, shopName: 'x' })); // too short
    await expect(writeCopy(brief, trajectory)).rejects.toThrow(/valid copy/);
    expect(create).toHaveBeenCalledTimes(4);
  });

  it('throws if the model never calls the tool', async () => {
    create.mockResolvedValueOnce({ content: [{ type: 'text', text: 'done' }], stop_reason: 'end_turn' });
    await expect(writeCopy(brief, trajectory)).rejects.toThrow(/did not call submit_copy/);
  });
});
