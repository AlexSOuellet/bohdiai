import { describe, it, expect, vi, beforeEach } from 'vitest';

const create = vi.fn();
vi.mock('@/lib/anthropic', () => ({ anthropicClient: () => ({ messages: { create } }) }));

import { bohdiConverse, ConversationError } from './conversation';

function turnMsg(input: unknown) {
  return { content: [{ type: 'tool_use', id: 't_turn', name: 'next_turn', input }], stop_reason: 'tool_use' };
}

const niche = { displayName: 'Candle maker', body: 'People buy candles for the feeling of a room.' };

beforeEach(() => create.mockReset());

describe('bohdiConverse', () => {
  it('opens a deep section by asking one question, forcing the next_turn tool and grounding in the niche', async () => {
    create.mockResolvedValueOnce(turnMsg({ action: 'ask', message: 'What made you start pouring candles?' }));
    const turn = await bohdiConverse({
      section: 'founder',
      niche,
      current: { 'founder.quote': 'A quiet room and a lit wick.' },
      conversation: [],
      depth: 'deep',
    });
    expect(turn).toEqual({ action: 'ask', message: 'What made you start pouring candles?' });
    const args = create.mock.calls[0]![0] as { system: string; tool_choice?: unknown; messages: unknown[] };
    expect(args.tool_choice).toEqual({ type: 'tool', name: 'next_turn' });
    expect(args.system).toContain(niche.body);
    // an empty conversation still needs a kickoff user turn so the model can respond
    expect(args.messages.length).toBeGreaterThan(0);
  });

  it('returns ready when Bohdi signals he has enough', async () => {
    create.mockResolvedValueOnce(
      turnMsg({ action: 'ready', message: "I think I've got your story — want me to write it?" }),
    );
    const turn = await bohdiConverse({
      section: 'founder',
      niche,
      current: {},
      conversation: [
        { speaker: 'bohdi', text: 'What made you start?' },
        { speaker: 'maker', text: 'My grandmother taught me at her kitchen table.' },
      ],
      depth: 'deep',
    });
    expect(turn.action).toBe('ready');
  });

  it('carries the conversation so far into the request as alternating messages', async () => {
    create.mockResolvedValueOnce(turnMsg({ action: 'ask', message: 'and who is it really for?' }));
    await bohdiConverse({
      section: 'founder',
      niche,
      current: {},
      conversation: [
        { speaker: 'bohdi', text: 'What made you start?' },
        { speaker: 'maker', text: 'My grandmother taught me' },
      ],
      depth: 'deep',
    });
    const args = create.mock.calls[0]![0] as { messages: { role: string; content: unknown }[] };
    const last = args.messages[args.messages.length - 1]!;
    expect(last.role).toBe('user'); // ends on the maker so Bohdi answers next
    expect(JSON.stringify(args.messages)).toContain('My grandmother taught me');
  });

  it('a light section gets the light-touch instruction, not the deep interview', async () => {
    create.mockResolvedValueOnce(turnMsg({ action: 'ask', message: 'want it warmer or shorter?' }));
    await bohdiConverse({ section: 'marquee', niche, current: {}, conversation: [], depth: 'light' });
    const args = create.mock.calls[0]![0] as { system: string };
    expect(args.system.toLowerCase()).toContain('light section');
  });

  it('rejects a malformed action and retries, then throws after the attempt budget', async () => {
    create.mockResolvedValue({ content: [{ type: 'text', text: 'no tool here' }], stop_reason: 'end_turn' });
    await expect(
      bohdiConverse({ section: 'founder', niche, current: {}, conversation: [], depth: 'deep' }),
    ).rejects.toBeInstanceOf(ConversationError);
    expect(create).toHaveBeenCalledTimes(4);
  });
});
