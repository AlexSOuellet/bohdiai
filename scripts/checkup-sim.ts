/**
 * Replays a maker through the checkup without anyone tapping: a cheap model
 * plays the maker, answering each new question from the facts in a saved case,
 * while the real checkup asks the questions and writes the write-up. Prints the
 * conversation, the write-up, and what the checkup's own calls cost (the
 * stand-in maker's calls are not counted).
 *
 *   npx tsx --env-file=.env.local scripts/checkup-sim.ts <case> [model] [effort]
 *   e.g. scripts/checkup-sim.ts alex-markets claude-sonnet-5-5 low
 *
 * Cases live in scripts/checkup-cases/<case>.json: { "facts": [[question, answer], ...] }
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type Anthropic from '@anthropic-ai/sdk';
import * as z from 'zod/v4';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { anthropicClient } from '../lib/anthropic';
import { nextStep, writeUp, type Effort } from '../lib/checkup/ai';
import { costOf, type UsageLike } from '../lib/checkup/cost';
import type { Answer, AskedQuestion, Turn } from '../lib/checkup/transcript';

const PersonaSchema = z.object({ picks: z.array(z.string()), note: z.string() });

function isEffort(v: string | undefined): v is Effort {
  return v === 'low' || v === 'medium' || v === 'high';
}

async function main(): Promise<void> {
  const [caseName, model = 'claude-sonnet-5-5', effortArg = 'low'] = process.argv.slice(2);
  if (caseName === undefined || !isEffort(effortArg)) throw new Error('usage: checkup-sim.ts <case> [model] [low|medium|high]');
  const file = path.join(process.cwd(), 'scripts', 'checkup-cases', `${caseName}.json`);
  const facts = (JSON.parse(readFileSync(file, 'utf-8')) as { facts: Array<[string, string]> }).facts;
  const factText = facts.map(([q, a]) => `Q: ${q}\nA: ${a}`).join('\n');

  const real = anthropicClient();
  const costs: number[] = [];
  // Counts what the checkup itself spends; the stand-in maker below uses `real` directly.
  const counted = {
    messages: {
      parse: async (params: { model: string }, options?: unknown) => {
        const resp = await real.messages.parse(params as Parameters<typeof real.messages.parse>[0], options as never);
        costs.push(costOf(params.model, resp.usage as UsageLike).dollars);
        return resp;
      },
    },
  } as unknown as Anthropic;

  async function answerAs(q: AskedQuestion): Promise<Answer> {
    const resp = await real.messages.parse({
      model: 'claude-haiku-5-5',
      max_tokens: 2000,
      output_config: { effort: 'low', format: zodOutputFormat(PersonaSchema) },
      messages: [
        {
          role: 'user',
          content: `You are a maker filling in a questionnaire. These are true facts about you, from answers you gave before:\n${factText}\n\nAnswer this new question the way you would, consistent with those facts. If the facts don't cover it, give a short, plausible answer that fits them.\n\nQuestion: ${q.prompt}\nType: ${q.kind}\nChoices: ${q.options.join(' | ') || '(none, type an answer)'}\n\nReturn picks: the exact choice text you pick (one for "single", any number for "multi", none for "text"), and note: anything you'd type (required for "text", otherwise usually empty).`,
        },
      ],
    });
    const p = resp.parsed_output ?? { picks: [], note: '' };
    const picks = p.picks.filter((v) => q.options.includes(v));
    const note = p.note.trim();
    if (q.kind === 'text') return note;
    if (q.kind === 'multi') return [...picks, ...(note !== '' ? [note] : [])];
    const one = picks[0];
    return one !== undefined && note !== '' ? `${one} (also: ${note})` : (one ?? note);
  }

  const turns: Turn[] = [];
  for (;;) {
    const step = await nextStep(turns, counted, model, effortArg);
    if (step.done) break;
    const answer = await answerAs(step.question);
    turns.push({ question: step.question, answer });
    process.stdout.write(
      `\n${step.question.bridge ? `(${step.question.bridge})\n` : ''}Q${turns.length} [${step.question.kind}] ${step.question.prompt}\n` +
        (step.question.options.length > 0 ? `   choices: ${step.question.options.join(' | ')}\n` : '') +
        `   → ${typeof answer === 'string' ? answer : answer.join('; ')}\n`,
    );
  }

  const w = await writeUp(turns, counted);
  process.stdout.write(`\n===== WRITE-UP =====\n\n${w.summary.join('\n\n')}\n\nThis week: ${w.first_steps[0] ?? ''}\nAfter that: ${w.first_steps[1] ?? ''}\n`);
  for (const p of w.paths) {
    process.stdout.write(`\n## ${p.title} [${p.group}]\n${p.body.join('\n\n')}\nTry this: ${p.step}\n`);
  }
  if (w.help.length > 0) {
    process.stdout.write(`\n===== HOW I CAN HELP =====\n${w.help_intro}\n`);
    for (const h of w.help) process.stdout.write(`\n[${h.offer}] ${h.text}\n`);
  }
  const total = costs.reduce((a, b) => a + b, 0);
  process.stdout.write(`\n===== COST =====\nquestions model: ${model} at ${effortArg} effort; ${turns.length} answers\ncheckup calls: ${costs.length}, total $${total.toFixed(4)}\n`);
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
  process.exit(1);
});
