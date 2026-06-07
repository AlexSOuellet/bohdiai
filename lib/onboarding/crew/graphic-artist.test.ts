import { describe, it, expect, vi, beforeEach } from 'vitest';

const create = vi.fn();
vi.mock('@/lib/anthropic', () => ({ anthropicClient: () => ({ messages: { create } }) }));

import { designLook, GraphicSpecSchema } from './graphic-artist';
import { moodAlignedSkins } from '@/lib/archetypes/main-street/skin-selection';
import type { Trajectory } from './trajectory';
import type { MomentScene } from './cinematographer';
import type { ProductDraft } from './copywriter-schema';
import type { CrewBrief } from './types';

const brief: CrewBrief = {
  shopName: 'Tannery Row',
  nicheDisplayName: 'Leatherworker',
  nicheBody: 'People buy leather goods that outlast them.',
  moodLabel: 'Rustic',
  moodDescription: 'warm and worn',
  productCount: 3,
  moodKey: 'rustic',
};

const trajectory: Trajectory = {
  feeling: 'the quiet pride of carrying something built to outlast you',
  customerWhy: 'people want one good thing that ages with them',
  visualWorld: 'warm and worn, low light, deep shadow',
  momentConcept: 'a hand resting on a worn bench',
  register: 'restrained',
};

const story = ['Built by hand', 'Made to outlast you'];

const scene: MomentScene = {
  kind: 'video',
  prompt: {
    composition: 'wide low angle',
    subject: 'a still hand on leather',
    environment: 'a dim workshop',
    atmosphere: 'quiet',
    camera: 'static 35mm',
    lighting: 'a shaft of window light',
    style: 'warm filmic grade',
  },
  alt: 'a hand on leather',
};

const products: ProductDraft[] = [
  { name: 'Belt', slug: 'belt', shortDescription: 'A belt for life', description: 'A belt that ages with you.', basePriceCents: 9800 },
  { name: 'Wallet', slug: 'wallet', shortDescription: 'A bifold', description: 'A bifold that softens with use.', basePriceCents: 6800 },
  { name: 'Tote', slug: 'tote', shortDescription: 'A roomy tote', description: 'A tote that carries the week.', basePriceCents: 22000 },
];

// 'main-street-ember' is in the rustic subset; build a valid look from it.
const look = {
  skinKey: 'main-street-ember',
  founderPhoto: { prompt: 'the maker at a worn bench, warm window light, shallow focus', alt: 'the maker at the bench' },
  products: [
    { slug: 'belt', imagePrompt: 'a leather belt coiled on aged oak, warm low light' },
    { slug: 'wallet', imagePrompt: 'a bifold wallet on stone, soft shadow' },
    { slug: 'tote', imagePrompt: 'a leather tote on a bench, window light' },
  ],
};

function toolMsg(input: unknown) {
  return { content: [{ type: 'tool_use', id: 't_look', name: 'set_look', input }], stop_reason: 'tool_use' };
}

beforeEach(() => {
  create.mockReset();
});

describe('designLook (the Graphic Artist)', () => {
  it('returns a validated look whose skin is in the mood subset and covers every product', async () => {
    create.mockResolvedValueOnce(toolMsg(look));
    const l = await designLook(brief, trajectory, story, scene, products);
    expect(moodAlignedSkins('rustic')).toContain(l.skinKey);
    expect(l.products.map((p) => p.slug).sort()).toEqual(['belt', 'tote', 'wallet']);
    expect(GraphicSpecSchema.safeParse(l).success).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('only offers the mood-aligned subset and forces the tool', async () => {
    create.mockResolvedValueOnce(toolMsg(look));
    await designLook(brief, trajectory, story, scene, products);
    const args = create.mock.calls[0]![0] as { system: string; tool_choice?: unknown };
    for (const key of moodAlignedSkins('rustic')) expect(args.system).toContain(key);
    expect(args.system).not.toContain('main-street-marquee'); // not in the rustic subset
    expect(args.tool_choice).toEqual({ type: 'tool', name: 'set_look' });
  });

  it('rejects a skin outside the mood subset, then accepts an in-subset fix (the D41 gate)', async () => {
    const offMood = { ...look, skinKey: 'main-street-marquee' }; // bold/street — not rustic
    create.mockResolvedValueOnce(toolMsg(offMood)).mockResolvedValueOnce(toolMsg(look));
    const l = await designLook(brief, trajectory, story, scene, products);
    expect(l.skinKey).toBe('main-street-ember');
    expect(create).toHaveBeenCalledTimes(2);
    const second = create.mock.calls[1]![0] as { messages: Array<{ role: string; content: unknown }> };
    expect(JSON.stringify(second.messages.at(-1))).toContain('skinKey');
  });

  it('rejects when a product is missing an image prompt, then accepts the fix', async () => {
    const missingOne = { ...look, products: look.products.slice(0, 2) }; // no tote
    create.mockResolvedValueOnce(toolMsg(missingOne)).mockResolvedValueOnce(toolMsg(look));
    const l = await designLook(brief, trajectory, story, scene, products);
    expect(l.products).toHaveLength(3);
    expect(create).toHaveBeenCalledTimes(2);
    const second = create.mock.calls[1]![0] as { messages: Array<{ role: string; content: unknown }> };
    expect(JSON.stringify(second.messages.at(-1))).toContain('tote');
  });

  it('throws when no valid look is produced within the attempt cap', async () => {
    create.mockResolvedValue(toolMsg({ ...look, skinKey: 'not-a-real-skin' }));
    await expect(designLook(brief, trajectory, story, scene, products)).rejects.toThrow(/valid look/);
    expect(create).toHaveBeenCalledTimes(4);
  });

  it('throws if the model never calls the tool', async () => {
    create.mockResolvedValueOnce({ content: [{ type: 'text', text: 'ok' }], stop_reason: 'end_turn' });
    await expect(designLook(brief, trajectory, story, scene, products)).rejects.toThrow(/did not call set_look/);
  });
});
