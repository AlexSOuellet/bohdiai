/**
 * The description writer (Alex, 2026-10-28): it writes a product's short
 * description and its full one from what the maker already gave us: the name,
 * what it's made of (Cost to make's supply list), the main photo, the price, and a
 * few facts they add. The maker edits it after. On the product screen and as a
 * tool of its own. The cheapest model (Alex): Claude Haiku 5.5, about four
 * hundredths of a cent a run with the photo. Each site gets a monthly limit, to
 * stop abuse rather than to save money (30 on Free, 100 on the paid plans).
 *
 * The prompt holds no sample wording (models copy examples). On the makers site
 * this is "help writing your descriptions": no AI talk.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod/v4';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

export const DESCRIBE_MODEL = 'claude-haiku-5-5';

import { FACTS_MAX, LONG_MAX, SHORT_MAX, type Description } from './describe-limits';

export { DESCRIBE_LIMIT, FACTS_MAX, LONG_MAX, SHORT_MAX, type Description } from './describe-limits';
const NAME_MAX = 120;
const MATERIALS_MAX = 30;

export type DescribeInput = {
  name: string;
  /** What it's made of: each supply and what every piece gets, as the maker named them. */
  materials: readonly string[];
  /** The maker's own few facts: finished size, what makes it special, who it's for. */
  facts: string;
  priceCents: number | null;
  /** The main photo's public address, or null. */
  photoUrl: string | null;
};

const schema = z.object({ short: z.string(), description: z.string() });

export function describeSystemPrompt(): string {
  return [
    'You write the description of one handmade piece for the maker who made it. The maker reads it and edits it before anyone else sees it, so it should sound like a person describing their own work and be ready to use as it stands.',
    'Use only what the maker gave you: the name, what it is made of, their own facts, the price and the photo. Never invent sizes, materials, techniques, uses, care instructions or a story they did not give you or the photo does not plainly show. When something is not known, leave it out.',
    'Describe the piece itself, as the maker would to someone holding it. Never mention the photo, the listing, the price or these instructions.',
    'Plain, warm and specific. No marketing filler, no superlatives, no exclamation marks, no emoji, no hashtags, no headings and no lists.',
    `The short description is one sentence, up to ${SHORT_MAX} characters, that says what the piece is. The full description is one to three short paragraphs, up to ${LONG_MAX} characters, separated by a blank line.`,
  ].join('\n\n');
}

/** What the maker gave us, as one message with the photo first. */
export function describeRequest(input: DescribeInput): Anthropic.MessageParam {
  const materials = input.materials.map((m) => m.trim()).filter((m) => m !== '').slice(0, MATERIALS_MAX);
  const text = [
    `The piece: ${input.name.trim().slice(0, NAME_MAX)}`,
    materials.length === 0 ? 'What it is made of: not given.' : `What it is made of, in the maker’s words:\n${materials.map((m) => `- ${m}`).join('\n')}`,
    input.facts.trim() === '' ? 'The maker’s own facts: none.' : `The maker’s own facts:\n${input.facts.trim().slice(0, FACTS_MAX)}`,
    input.priceCents === null ? 'Price: not set.' : `Price, for your sense of the piece only: $${(input.priceCents / 100).toFixed(2)}`,
    input.photoUrl === null ? 'There is no photo.' : 'The photo above is the piece.',
    '',
    'Write the short description and the full description. Some supplies are things used up in making it (wax, glue, sealer); describe the piece, not the workshop.',
  ].join('\n');
  return {
    role: 'user',
    content: [
      ...(input.photoUrl === null ? [] : [{ type: 'image', source: { type: 'url', url: input.photoUrl } } satisfies Anthropic.ImageBlockParam]),
      { type: 'text', text },
    ],
  };
}

export type DescribeResult = { ok: true; text: Description } | { ok: false; error: string };

/** Trimmed to fit the product's own boxes. */
function fit(d: Description): Description {
  return { short: d.short.trim().slice(0, SHORT_MAX), description: d.description.trim().slice(0, LONG_MAX) };
}

/** One run. `client` is the Anthropic client (injected for tests). */
export async function writeDescription(client: Pick<Anthropic, 'messages'>, input: DescribeInput): Promise<DescribeResult> {
  if (input.name.trim() === '') return { ok: false, error: 'Give the piece a name first.' };
  const response = await client.messages.parse({
    model: DESCRIBE_MODEL,
    max_tokens: 2000,
    system: describeSystemPrompt(),
    messages: [describeRequest(input)],
    output_config: { effort: 'low', format: zodOutputFormat(schema) },
  });
  if (response.stop_reason === 'refusal') return { ok: false, error: 'This one couldn’t be written. Try changing the name or your facts.' };
  if (response.stop_reason === 'max_tokens') return { ok: false, error: 'The description ran long. Try again.' };
  const out = response.parsed_output;
  if (out === null || out === undefined || out.short.trim() === '' || out.description.trim() === '') return { ok: false, error: 'The description didn’t come back right. Try again.' };
  return { ok: true, text: fit(out) };
}

/** The start of this month, where the month's runs are counted from (UTC). */
export function monthStart(now: Date): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/** When the count starts again, for the message once the limit is reached. */
export function resetsOn(now: Date): string {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return next.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
}
