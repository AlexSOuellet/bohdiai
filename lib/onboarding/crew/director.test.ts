import { describe, it, expect, vi, beforeEach } from 'vitest';

const create = vi.fn();
vi.mock('@/lib/anthropic', () => ({ anthropicClient: () => ({ messages: { create } }) }));

import { direct, __buildDirectorPromptForTest } from './director';
import { TrajectorySchema } from './trajectory';
import type { CrewBrief } from './types';

const baseBrief: CrewBrief = {
  shopName: 'Coastal Candles',
  nicheDisplayName: 'Candle maker',
  nicheBody: 'People buy candles to turn an ordinary evening into something that feels like home, calm, and theirs.',
  moodLabel: 'Modern',
  moodDescription: 'a confident contemporary design statement',
  productCount: 6,
  moodKey: 'modern',
};

const brief = baseBrief;

const valid = {
  feeling: 'the hush of a light-filled coastal morning, calm and quietly upscale',
  customerWhy: 'a candle turns an ordinary evening into a moment that feels like home and calm',
  visualWorld: 'clean-modern, high-key bright, airy with low contrast',
  momentConcept: 'a single flame breathing in soft window light, slow ambient drift, cool grade',
  register: 'restrained' as const,
  momentKind: 'video' as const,
};

function toolMsg(input: unknown) {
  return { content: [{ type: 'tool_use', id: 't_traj', name: 'set_trajectory', input }], stop_reason: 'tool_use' };
}

beforeEach(() => {
  create.mockReset();
});

describe('direct (the Director)', () => {
  it('returns the validated trajectory from a valid first call', async () => {
    create.mockResolvedValueOnce(toolMsg(valid));
    const t = await direct(brief);
    expect(t).toEqual(valid);
    expect(TrajectorySchema.safeParse(t).success).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('forces the set_trajectory tool', async () => {
    create.mockResolvedValueOnce(toolMsg(valid));
    await direct(brief);
    const args = create.mock.calls[0]![0] as { tool_choice?: unknown };
    expect(args.tool_choice).toEqual({ type: 'tool', name: 'set_trajectory' });
  });

  it('retries once with the validation issues, then succeeds', async () => {
    create
      .mockResolvedValueOnce(toolMsg({ ...valid, feeling: '' })) // < 12 chars, invalid
      .mockResolvedValueOnce(toolMsg(valid));
    const t = await direct(brief);
    expect(t.feeling).toBe(valid.feeling);
    expect(create).toHaveBeenCalledTimes(2);
    // the retry must feed the validation issues back so the model can fix them
    const second = create.mock.calls[1]![0] as { messages: Array<{ role: string; content: unknown }> };
    const lastMsg = JSON.stringify(second.messages.at(-1));
    expect(lastMsg).toContain('feeling');
  });

  it('throws when no valid trajectory is produced within two attempts', async () => {
    create.mockResolvedValue(toolMsg({ ...valid, feeling: '' }));
    await expect(direct(brief)).rejects.toThrow(/valid trajectory/);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('throws if the model never calls the tool', async () => {
    create.mockResolvedValueOnce({ content: [{ type: 'text', text: 'hmm' }], stop_reason: 'end_turn' });
    await expect(direct(brief)).rejects.toThrow(/did not call set_trajectory/);
  });

  it('forwards the director-picked momentKind through to the trajectory', async () => {
    // same mock pattern as the rest of the suite — override momentKind to spotlight
    create.mockResolvedValueOnce(toolMsg({ ...valid, momentKind: 'spotlight' }));
    const t = await direct(brief);
    expect(t.momentKind).toBe('spotlight');
  });
});

describe('director prompt — makerWork', () => {
  it("includes the maker's work summary when present", () => {
    const brief = { ...baseBrief, makerWork: 'This maker turns small bowls from local walnut.' };
    const prompt = __buildDirectorPromptForTest(brief);
    expect(prompt).toContain('WHAT THIS MAKER ACTUALLY MAKES');
    expect(prompt).toContain('small bowls from local walnut');
  });

  it('omits the maker-work section when undefined', () => {
    const prompt = __buildDirectorPromptForTest(baseBrief);
    expect(prompt).not.toContain('WHAT THIS MAKER ACTUALLY MAKES');
  });
});
