import { describe, it, expect, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { nextStep, writeUp, settle, stripStepLabel, CheckupAiError } from './ai';
import { OPENING, MAX_QUESTIONS, type Turn } from './transcript';
import { PICKER_PROMPT, WRITEUP_PROMPT } from './prompt';
import { bankQuestion, toAsked, GOALS } from './bank';

vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/anthropic', () => ({
  anthropicClient: () => {
    throw new Error('tests pass their own client');
  },
}));

/** A stand-in client whose parse() answers with each of `outputs` in turn. */
function fakeClient(...outputs: Array<{ parsed_output: unknown; stop_reason?: string }>): {
  client: Anthropic;
  calls: unknown[];
} {
  const calls: unknown[] = [];
  let i = 0;
  const parse = vi.fn((params: unknown) => {
    calls.push(params);
    const out = outputs[Math.min(i, outputs.length - 1)];
    i += 1;
    return Promise.resolve({ stop_reason: 'end_turn', usage: { input_tokens: 100, output_tokens: 50 }, ...out });
  });
  // Only messages.parse is used by the checkup.
  const client = { messages: { parse } } as unknown as Anthropic;
  return { client, calls };
}

const turn = (id: string, answer: string | string[]): Turn => {
  const opening = OPENING.find((q) => q.id === id);
  const bank = bankQuestion(id);
  const question = opening ?? (bank !== undefined ? toAsked(bank, [], '') : undefined);
  if (question === undefined) throw new Error(`no question ${id}`);
  return { question, answer };
};

const opened = (goal: keyof typeof GOALS = 'test'): Turn[] => [turn('make', 'Decoupage trays'), turn('goal', GOALS[goal])];

describe('nextStep', () => {
  it('asks the two fixed opening questions without calling the model', async () => {
    const { client, calls } = fakeClient({ parsed_output: null });
    expect(await nextStep([], client)).toEqual({ done: false, question: OPENING[0] });
    expect(await nextStep(opened().slice(0, 1), client)).toEqual({ done: false, question: OPENING[1] });
    expect(calls).toHaveLength(0);
  });

  it('asks the model to choose from the bank, with what’s available and what must still be covered', async () => {
    const { client, calls } = fakeClient({ parsed_output: { done: false, next_id: 'stage', bridge: 'Trays are a good start.' } });
    const step = await nextStep(opened(), client);
    expect(step).toMatchObject({ done: false, question: { id: 'stage', bridge: 'Trays are a good start.' } });
    const params = calls[0] as {
      model: string;
      system: Array<{ text: string; cache_control: unknown }>;
      output_config: { effort: string };
      messages: Array<{ content: string }>;
    };
    expect(params.model).toBe('claude-haiku-5-5');
    expect(params.output_config.effort).toBe('medium');
    expect(params.system[0]?.text).toBe(PICKER_PROMPT);
    expect(params.system[0]?.cache_control).toEqual({ type: 'ephemeral' });
    expect(params.messages[0]?.content).toContain('Available next (choose one id):');
    expect(params.messages[0]?.content).toContain('Must-cover still unanswered: stage');
  });

  it('wraps up at the question limit without calling the model', async () => {
    const { client, calls } = fakeClient({ parsed_output: null });
    expect(await nextStep(Array(MAX_QUESTIONS).fill(turn('make', 'x')), client)).toEqual({ done: true });
    expect(calls).toHaveLength(0);
  });

  it('treats a refusal as a failure', async () => {
    const { client } = fakeClient({ parsed_output: null, stop_reason: 'refusal' });
    await expect(nextStep(opened(), client)).rejects.toThrow(CheckupAiError);
  });
});

describe('settle', () => {
  it('won’t finish while a must-cover question is unanswered', () => {
    const step = settle({ done: true, next_id: '', bridge: 'All set.' }, opened());
    expect(step).toMatchObject({ done: false, question: { id: 'stage', bridge: '' } });
  });

  it('ignores a choice that isn’t available and falls back to what’s missing', () => {
    const step = settle({ done: false, next_id: 'not_a_question', bridge: 'Hm.' }, opened());
    expect(step).toMatchObject({ done: false, question: { id: 'stage', bridge: '' } });
    expect(settle(null, opened())).toMatchObject({ done: false, question: { id: 'stage' } });
  });

  it('finishes when nothing must-cover remains and the model is done', () => {
    const all = [
      ...opened('cover'),
      turn('stage', 'I haven’t sold anything yet'),
      turn('first_place', ['Etsy']),
      turn('standout', 'Bright colors'),
      turn('held', ['Time']),
    ];
    expect(settle({ done: true, next_id: '', bridge: '' }, all)).toEqual({ done: true });
  });
});

describe('writeUp', () => {
  const good = {
    summary: ['You make decoupage trays.'],
    first_steps: ['This week: price three pieces.', 'After that, find one small market.', 'A third'],
    paths: [
      { group: 'better', title: 'Price to cover supplies', body: ['Write down costs.'], step: 'Do it.' },
      { group: 'bigger', title: '  ', body: ['x'], step: 'x' },
    ],
    help_intro: 'You need somewhere to send people.',
    help: [
      { offer: 'full_shop', text: 'Not chosen by the rules.' },
      { offer: 'showcase', text: 'A page for your card.' },
      { offer: 'market', text: 'Your table on your phone.' },
    ],
  };

  it('returns the write-up with two clean first steps, from the write-up instructions', async () => {
    const { client, calls } = fakeClient({ parsed_output: good });
    const markets = [...opened(), turn('stage', 'I’ve sold a few, mostly to people I know'), turn('sources', ['Craft shows and markets']), turn('market_often', 'Most weekends')];
    const w = await writeUp(markets, client);
    expect(w.first_steps).toEqual(['price three pieces.', 'find one small market.']);
    expect(w.paths).toHaveLength(1);
    // Only the offers the rules chose, in the rules' order.
    expect(w.help.map((h) => h.offer)).toEqual(['market', 'showcase']);
    expect(w.help_intro).toBe('You need somewhere to send people.');
    expect((calls[0] as { messages: Array<{ content: string }> }).messages[0]?.content).toContain('market (market site) — lead');
    const params = calls[0] as { output_config: { effort: string }; system: Array<{ text: string }> };
    expect(params.output_config.effort).toBe('medium');
    expect(params.system[0]?.text).toBe(WRITEUP_PROMPT);
  });

  it('drops the help section when no offers fit', async () => {
    const hasSite = [...opened(), turn('stage', 'I’ve sold a few, mostly to people I know'), turn('sources', ['My own website'])];
    const w = await writeUp(hasSite, fakeClient({ parsed_output: good }).client);
    expect(w.help).toEqual([]);
    expect(w.help_intro).toBe('');
  });

  it('fails on an empty, unparsed or refused write-up', async () => {
    await expect(writeUp(opened(), fakeClient({ parsed_output: null }).client)).rejects.toThrow(CheckupAiError);
    await expect(writeUp(opened(), fakeClient({ parsed_output: { ...good, paths: [] } }).client)).rejects.toThrow(
      'no usable write-up',
    );
    await expect(writeUp(opened(), fakeClient({ parsed_output: good, stop_reason: 'refusal' }).client)).rejects.toThrow(
      'refused',
    );
  });

  it('strips step labels however they were written', () => {
    expect(stripStepLabel('This week — call the market.')).toBe('call the market.');
    expect(stripStepLabel('Call the market.')).toBe('Call the market.');
  });
});

describe('the instructions', () => {
  it('carry the rules Alex set', () => {
    expect(PICKER_PROMPT).toContain('Never ask about hourly rates');
    expect(PICKER_PROMPT).toContain('You never write or reword a question');
    expect(PICKER_PROMPT).toContain('- stage [single] Where are you with selling right now?');
    expect(WRITEUP_PROMPT).toContain('Never mention AI');
    expect(WRITEUP_PROMPT).toContain('East Nowhere');
    expect(WRITEUP_PROMPT).toContain('Market site');
    expect(WRITEUP_PROMPT).toContain('HOW I CAN HELP');
    expect(WRITEUP_PROMPT).toContain('never mentions Alex\'s services');
    expect(WRITEUP_PROMPT).not.toContain('Browse what I have');
  });
});
