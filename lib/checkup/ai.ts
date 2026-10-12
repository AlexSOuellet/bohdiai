import type Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { anthropicClient } from '@/lib/anthropic';
import { withTimeout } from '@/lib/with-timeout';
import { logger } from '@/lib/logger';
import { costOf, type UsageLike } from './cost';
import { PICKER_PROMPT, WRITEUP_PROMPT } from './prompt';
import { type Turn, MAX_QUESTIONS, OPENING, transcriptText } from './transcript';
import { available, missingMust, toAsked, type BankQuestion } from './bank';
import { PickSchema, WriteUpSchema, type NextStep, type WriteUp } from './schemas';
import { chooseOffers, offersBrief } from './offers';
import { readPricing, pricingBrief } from './pricing';

export type { NextStep, WriteUp } from './schemas';

/**
 * The two calls behind the checkup: which bank question comes next, and the
 * write-up. Both are stateless — the transcript comes in, one answer goes out.
 */

/** Alex: no need for a premier model. Haiku picks from fixed questions, so it can't word them badly. */
export const MODELS = { next: 'claude-haiku-5-5', writeup: 'claude-haiku-5-5' } as const;

/** How hard the model thinks before choosing a question. */
export type Effort = 'low' | 'medium' | 'high';
export const NEXT_EFFORT: Effort = 'medium';

const NEXT_TIMEOUT_MS = 45_000;
const WRITEUP_TIMEOUT_MS = 120_000;

export class CheckupAiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckupAiError';
  }
}

const pickerSystem: Anthropic.TextBlockParam[] = [
  { type: 'text', text: PICKER_PROMPT, cache_control: { type: 'ephemeral' } },
];
const writeupSystem: Anthropic.TextBlockParam[] = [
  { type: 'text', text: WRITEUP_PROMPT, cache_control: { type: 'ephemeral' } },
];

/** Every call logs what it cost, so we know what a checkup really costs to run. */
function logCost(call: 'next' | 'writeup', model: string, turns: number, usage: UsageLike): void {
  logger.info('checkup cost', { call, model, turns, ...costOf(model, usage) });
}

function refused(resp: { stop_reason: string | null }): boolean {
  return resp.stop_reason === 'refusal';
}

/**
 * What comes next. The code decides what's allowed; the model only chooses
 * among it. It can't finish while a must-cover question is unanswered, and an
 * unusable choice falls back to the next must-cover (or available) question.
 */
export function settle(
  pick: { done: boolean; next_id: string; bridge: string } | null,
  turns: readonly Turn[],
): NextStep {
  const open = available(turns);
  const missing = missingMust(turns);
  if (open.length === 0) return { done: true };
  if (pick !== null && pick.done && missing.length === 0) return { done: true };
  const chosen: BankQuestion | undefined =
    (pick !== null && !pick.done ? open.find((q) => q.id === pick.next_id) : undefined) ?? missing[0] ?? open[0];
  // A bridge written for a question we overrode may not fit; drop it then.
  const bridge = pick !== null && chosen?.id === pick.next_id ? pick.bridge : '';
  return chosen === undefined ? { done: true } : { done: false, question: toAsked(chosen, turns, bridge) };
}

export async function nextStep(
  turns: readonly Turn[],
  client: Anthropic = anthropicClient(),
  model: string = MODELS.next,
  effort: Effort = NEXT_EFFORT,
): Promise<NextStep> {
  const opening = OPENING[turns.length];
  if (opening !== undefined) return { done: false, question: opening };
  if (turns.length >= MAX_QUESTIONS) return { done: true };
  const open = available(turns);
  if (open.length === 0) return { done: true };

  const missing = missingMust(turns);
  const content = [
    `Here is the conversation so far.\n\n${transcriptText(turns)}`,
    `Available next (choose one id): ${open.map((q) => q.id).join(', ')}`,
    `Must-cover still unanswered: ${missing.length > 0 ? missing.map((q) => q.id).join(', ') : 'none'}`,
    'Choose the next question, or set done to true if nothing must-cover remains and more questions would not change your recommendations.',
  ].join('\n\n');

  const resp = await withTimeout(
    (signal) =>
      client.messages.parse(
        {
          model,
          max_tokens: 4000,
          system: pickerSystem,
          output_config: { effort, format: zodOutputFormat(PickSchema) },
          messages: [{ role: 'user', content }],
        },
        { signal },
      ),
    NEXT_TIMEOUT_MS,
    'checkup next question',
  );
  logCost('next', model, turns.length, resp.usage);
  if (refused(resp)) throw new CheckupAiError('next question refused');
  return settle(resp.parsed_output, turns);
}

/** The page adds "This week" / "After that"; drop them if the model wrote them too. */
export function stripStepLabel(step: string): string {
  return step.replace(/^\s*(this week|after that)\s*[:,.—-]\s*/i, '').trim();
}

/** Alex's write-up for the whole conversation. */
export async function writeUp(
  turns: readonly Turn[],
  client: Anthropic = anthropicClient(),
  model: string = MODELS.writeup,
): Promise<WriteUp> {
  const offers = chooseOffers(turns);
  const content = `Here is the whole conversation.\n\n${transcriptText(turns)}\n\n${pricingBrief(readPricing(turns))}\n\n${offersBrief(offers)}\n\nWrite Alex's write-up for this maker.`;
  const resp = await withTimeout(
    (signal) =>
      client.messages.parse(
        {
          model,
          max_tokens: 16000,
          system: writeupSystem,
          output_config: { effort: 'medium', format: zodOutputFormat(WriteUpSchema) },
          messages: [{ role: 'user', content }],
        },
        { signal },
      ),
    WRITEUP_TIMEOUT_MS,
    'checkup write-up',
  );
  logCost('writeup', model, turns.length, resp.usage);
  if (refused(resp)) throw new CheckupAiError('write-up refused');
  const parsed = resp.parsed_output;
  if (parsed === null || parsed.summary.length === 0 || parsed.paths.length === 0) {
    throw new CheckupAiError('no usable write-up');
  }
  return {
    summary: parsed.summary,
    first_steps: parsed.first_steps.slice(0, 2).map(stripStepLabel),
    paths: parsed.paths.filter((p) => p.title.trim() !== '' && p.body.length > 0),
    // Only the offers the rules chose, in their order, whatever the model wrote.
    help_intro: offers.length > 0 ? parsed.help_intro.trim() : '',
    help: offers.flatMap((o) => parsed.help.filter((h) => h.offer === o && h.text.trim() !== '').slice(0, 1)),
  };
}
