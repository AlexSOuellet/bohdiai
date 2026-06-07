import { describe, it, expect, vi, beforeEach } from 'vitest';

const create = vi.fn();
vi.mock('@/lib/anthropic', () => ({ anthropicClient: () => ({ messages: { create } }) }));

import { shootMoment, MomentSceneSchema } from './cinematographer';
import type { Trajectory } from './trajectory';

const trajectory: Trajectory = {
  feeling: 'the quiet pride of carrying something built to outlast you',
  customerWhy: 'people want one good thing that ages with them',
  visualWorld: 'warm and worn, low light, deep shadow',
  momentConcept: 'a hand resting on a worn bench, dust drifting in a slow shaft of light',
  register: 'restrained',
};

const story = ['Built by hand', 'Made to outlast you'];

const scene = {
  kind: 'video' as const,
  prompt: {
    composition: 'wide low angle across a worn bench',
    subject: 'a still hand resting on leather',
    environment: 'a dim workshop',
    atmosphere: 'quiet and still',
    camera: 'static wide shot, 35mm',
    lighting: 'a single shaft of window light',
    style: 'warm filmic grade',
  },
  alt: 'a hand resting on leather in a dim workshop',
};

function toolMsg(input: unknown) {
  return { content: [{ type: 'tool_use', id: 't_moment', name: 'set_moment', input }], stop_reason: 'tool_use' };
}

beforeEach(() => {
  create.mockReset();
});

describe('shootMoment (the Cinematographer)', () => {
  it('returns the validated moment scene from a valid first call', async () => {
    create.mockResolvedValueOnce(toolMsg(scene));
    const s = await shootMoment(trajectory, story);
    expect(s.kind).toBe('video');
    expect(s.prompt.lighting).toBe('a single shaft of window light');
    expect(MomentSceneSchema.safeParse(s).success).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('feeds the momentConcept and story into the prompt and forces the tool', async () => {
    create.mockResolvedValueOnce(toolMsg(scene));
    await shootMoment(trajectory, story);
    const args = create.mock.calls[0]![0] as { system: string; tool_choice?: unknown };
    expect(args.system).toContain(trajectory.momentConcept);
    expect(args.system).toContain('Built by hand');
    expect(args.tool_choice).toEqual({ type: 'tool', name: 'set_moment' });
  });

  it('accepts a still as a real choice', async () => {
    create.mockResolvedValueOnce(toolMsg({ ...scene, kind: 'image' }));
    const s = await shootMoment(trajectory, story);
    expect(s.kind).toBe('image');
  });

  it('rejects an incomplete scene, then accepts the fix', async () => {
    const bad = { ...scene, prompt: { ...scene.prompt, composition: 'ab' } }; // < 3 chars
    create.mockResolvedValueOnce(toolMsg(bad)).mockResolvedValueOnce(toolMsg(scene));
    const s = await shootMoment(trajectory, story);
    expect(s.prompt.composition).toBe('wide low angle across a worn bench');
    expect(create).toHaveBeenCalledTimes(2);
    const second = create.mock.calls[1]![0] as { messages: Array<{ role: string; content: unknown }> };
    expect(JSON.stringify(second.messages.at(-1))).toContain('composition');
  });

  it('throws when no valid moment is produced within the attempt cap', async () => {
    create.mockResolvedValue(toolMsg({ ...scene, alt: 'x' })); // too short
    await expect(shootMoment(trajectory, story)).rejects.toThrow(/valid moment/);
    expect(create).toHaveBeenCalledTimes(3);
  });

  it('throws if the model never calls the tool', async () => {
    create.mockResolvedValueOnce({ content: [{ type: 'text', text: 'cut' }], stop_reason: 'end_turn' });
    await expect(shootMoment(trajectory, story)).rejects.toThrow(/did not call set_moment/);
  });
});
