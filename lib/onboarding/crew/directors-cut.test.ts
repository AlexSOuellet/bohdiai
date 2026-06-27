import { describe, it, expect, vi, beforeEach } from 'vitest';

const create = vi.fn();
vi.mock('@/lib/anthropic', () => ({ anthropicClient: () => ({ messages: { create } }) }));

import { directorsCut } from './directors-cut';
import type { Trajectory } from './trajectory';
import type { CrewBrief, CrewOutput } from './types';

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
  heroConcept: 'a hand resting on a worn bench',
  register: 'restrained',
  heroKind: 'video',
};

const current: CrewOutput = {
  copy: {
    shopName: 'Tannery Row',
    identity: { wordmark: 'Tannery Row', nav: [{ label: 'Shop', target: 'shop' }, { label: 'Our story', target: 'about' }] },
    moment: { story: ['Built by hand', 'Made to outlast you'], eyebrow: 'From the workshop', brand: 'Tannery Row', sub: 'Hand-cut leather goods built to outlast you', ctaLabel: 'See the work', ctaTarget: 'shop' },
    goods: { title: 'The bench', treatment: 'procession' },
    founder: { quote: 'I would rather make one belt that lasts thirty years than ten that fall apart.', attribution: 'Sam, founder', treatment: 'quote' },
    close: { label: 'Come by', headline: 'Built to outlast us', ctaLabel: 'Order yours', ctaTarget: 'contact' },
    about: { heading: 'The story', story: ['We started at a single bench with a knife and more patience than sense, and that has not changed.', 'Everything here is meant to be used hard and handed down the way good things always were.'] },
    contact: { heading: 'Say hello', intro: 'We read everything that comes in and would love to hear what you are looking for.' },
    products: [
      { name: 'Belt', slug: 'belt', shortDescription: 'A belt for life', description: 'A belt that ages with you.', basePriceCents: 9800 },
      { name: 'Wallet', slug: 'wallet', shortDescription: 'A bifold', description: 'A bifold that softens with use.', basePriceCents: 6800 },
      { name: 'Tote', slug: 'tote', shortDescription: 'A roomy tote', description: 'A tote that carries the week.', basePriceCents: 22000 },
    ],
  },
  moment: {
    kind: 'video',
    prompt: { composition: 'wide low angle', subject: 'a still hand on leather', environment: 'a dim workshop', atmosphere: 'quiet', camera: 'static 35mm', lighting: 'a shaft of window light', style: 'warm filmic grade' },
    alt: 'a hand on leather',
  },
  look: {
    skinKey: 'main-street-ember',
    founderPhoto: { prompt: 'the maker at a worn bench, warm window light', alt: 'the maker' },
    products: [
      { slug: 'belt', imagePrompt: 'a leather belt on aged oak, warm low light' },
      { slug: 'wallet', imagePrompt: 'a bifold wallet on stone, soft shadow' },
      { slug: 'tote', imagePrompt: 'a leather tote on a bench, window light' },
    ],
  },
};

function toolMsg(input: unknown) {
  return { content: [{ type: 'tool_use', id: 't_cut', name: 'final_cut', input }], stop_reason: 'tool_use' };
}

beforeEach(() => {
  create.mockReset();
});

describe('directorsCut (the coherence pass)', () => {
  it('passes everything through unchanged when it calls final_cut with no revisions', async () => {
    create.mockResolvedValueOnce(toolMsg({ notes: 'coheres' }));
    const out = await directorsCut(brief, trajectory, current);
    expect(out).toEqual(current);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('applies a copy revision and keeps the untouched pieces identical', async () => {
    const revisedCopy = { ...current.copy, moment: { ...current.copy.moment, story: ['Built by hand', 'Kept for a lifetime'] } };
    create.mockResolvedValueOnce(toolMsg({ notes: 'second line was flat', copy: revisedCopy }));
    const out = await directorsCut(brief, trajectory, current);
    expect(out.copy.moment.story).toEqual(['Built by hand', 'Kept for a lifetime']);
    expect(out.moment).toBe(current.moment); // untouched, same reference
    expect(out.look).toBe(current.look);
  });

  it('rejects a revised skin that leaves the mood subset', async () => {
    const offMood = { ...current.look, skinKey: 'main-street-marquee' };
    create.mockResolvedValueOnce(toolMsg({ look: offMood })).mockResolvedValueOnce(toolMsg({ notes: 'ok' }));
    const out = await directorsCut(brief, trajectory, current);
    expect(out.look.skinKey).toBe('main-street-ember'); // fell back to unchanged
    expect(create).toHaveBeenCalledTimes(2);
    const second = create.mock.calls[1]![0] as { messages: Array<{ role: string; content: unknown }> };
    expect(JSON.stringify(second.messages.at(-1))).toContain('skinKey');
  });

  it('rejects a copy revision that changes a slug without updating the look', async () => {
    const renamed = { ...current.copy, products: [{ ...current.copy.products[0]!, slug: 'cinch-belt' }, current.copy.products[1]!, current.copy.products[2]!] };
    create.mockResolvedValueOnce(toolMsg({ copy: renamed })).mockResolvedValueOnce(toolMsg({ notes: 'reverted' }));
    const out = await directorsCut(brief, trajectory, current);
    expect(create).toHaveBeenCalledTimes(2);
    const second = create.mock.calls[1]![0] as { messages: Array<{ role: string; content: unknown }> };
    expect(JSON.stringify(second.messages.at(-1))).toContain('cinch-belt');
    expect(out.copy.products[0]!.slug).toBe('belt'); // unchanged after revert
  });

  it('throws if it never settles within the attempt cap', async () => {
    create.mockResolvedValue(toolMsg({ look: { ...current.look, skinKey: 'nope' } }));
    await expect(directorsCut(brief, trajectory, current)).rejects.toThrow(/did not settle/);
    expect(create).toHaveBeenCalledTimes(3);
  });

  it('throws if the model never calls the tool', async () => {
    create.mockResolvedValueOnce({ content: [{ type: 'text', text: 'looks good' }], stop_reason: 'end_turn' });
    await expect(directorsCut(brief, trajectory, current)).rejects.toThrow(/did not call final_cut/);
  });

  it('applies a valid moment revision and keeps the other pieces by reference', async () => {
    const revisedMoment = { ...current.moment, alt: 'a worn hand resting on cut leather' };
    create.mockResolvedValueOnce(toolMsg({ notes: 'tightened the alt', moment: revisedMoment }));
    const out = await directorsCut(brief, trajectory, current);
    expect(out.moment.alt).toBe('a worn hand resting on cut leather');
    expect(out.copy).toBe(current.copy);
    expect(out.look).toBe(current.look);
  });

  it('rejects a schema-invalid copy revision, then settles', async () => {
    create.mockResolvedValueOnce(toolMsg({ copy: { shopName: 'x' } })).mockResolvedValueOnce(toolMsg({ notes: 'ok' }));
    const out = await directorsCut(brief, trajectory, current);
    expect(create).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(create.mock.calls[1]![0])).toContain('copy.');
    expect(out).toEqual(current);
  });

  it('rejects a schema-invalid moment revision, then settles', async () => {
    create.mockResolvedValueOnce(toolMsg({ moment: { kind: 'video' } })).mockResolvedValueOnce(toolMsg({ notes: 'ok' }));
    await directorsCut(brief, trajectory, current);
    expect(JSON.stringify(create.mock.calls[1]![0])).toContain('moment.');
  });

  it('rejects a schema-invalid look revision, then settles', async () => {
    create.mockResolvedValueOnce(toolMsg({ look: { skinKey: 'main-street-ember' } })).mockResolvedValueOnce(toolMsg({ notes: 'ok' }));
    await directorsCut(brief, trajectory, current);
    expect(JSON.stringify(create.mock.calls[1]![0])).toContain('look.');
  });

  it('rejects a look revision with duplicate product slugs, then settles', async () => {
    const dupLook = {
      ...current.look,
      products: [current.look.products[0]!, current.look.products[0]!, current.look.products[1]!, current.look.products[2]!],
    };
    create.mockResolvedValueOnce(toolMsg({ look: dupLook })).mockResolvedValueOnce(toolMsg({ notes: 'ok' }));
    await directorsCut(brief, trajectory, current);
    expect(JSON.stringify(create.mock.calls[1]![0])).toContain('duplicate product slugs');
  });
});
