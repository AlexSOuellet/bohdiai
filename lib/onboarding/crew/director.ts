/**
 * The Director (Bohdi). Reads niche + mood and sets ONE creative trajectory the
 * whole crew executes to (D40). This is the only place the overall vision is
 * decided; the copywriter, cinematographer, and graphic artist each match it.
 *
 * The call is a single forced tool use with one retry on a validation miss, and
 * a hard per-call timeout (closing the old "no timeout on the authoring loop"
 * gap). It returns a validated Trajectory — nothing else.
 *
 * No bias: the prompt hands over the role and the materials (the full niche body
 * and the maker's mood) and names the trajectory's five fields — what each field
 * is FOR, nothing about how to fill it. It never names a look, a feeling, an
 * aesthetic, or even an axis to weigh; those are the Director's to decide from the
 * materials. Variety comes from the niche file's range, not from us.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';
import { withTimeout } from '@/lib/with-timeout';
import { TrajectorySchema, type Trajectory } from './trajectory';
import type { CrewBrief } from './types';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1500;
const TIMEOUT_MS = 60_000;

const SET_TRAJECTORY_TOOL: Anthropic.Tool = {
  name: 'set_trajectory',
  description: 'Lock the one creative trajectory the whole store will be built to.',
  input_schema: {
    type: 'object',
    properties: {
      feeling: { type: 'string', description: 'The single feeling the whole store should leave a visitor with, in one line.' },
      customerWhy: { type: 'string', description: "Why someone chooses this maker's work." },
      visualWorld: { type: 'string', description: 'The look and feel the store should have.' },
      momentConcept: { type: 'string', description: 'The concept for the hero moment.' },
      register: { type: 'string', enum: ['loud', 'restrained'], description: 'Loud or restrained type.' },
      momentKind: {
        type: 'string',
        enum: ['video', 'spotlight'],
        description: "Which kind of Moment the front door plays. 'video' when the scene contains real ambient motion that belongs to the subject (steam off bread, a flame, water, hands at work). 'spotlight' when the product is at rest and inventing motion would feel fake — the rise out of black is the cinematic arc.",
      },
    },
    required: ['feeling', 'customerWhy', 'visualWorld', 'momentConcept', 'register', 'momentKind'],
  },
};

function buildDirectorPrompt(brief: CrewBrief): string {
  const niche = brief.nicheBody.trim();
  const makerWork = brief.makerWork?.trim();
  const makerWorkClause = makerWork
    ? `

WHAT THIS MAKER ACTUALLY MAKES — derived from the photos the maker uploaded. Treat this as more specific than the niche file. Ground the trajectory in this actual work, not in a niche stereotype:
${makerWork}`
    : '';
  return `You are Bohdi, the DIRECTOR of this maker's storefront. You set ONE creative trajectory — the single feeling the whole store serves. Your crew (a copywriter, a cinematographer, a graphic artist) each execute their craft to it. Make it true to THIS maker, within the mood the maker chose.

THE MAKER
- Shop: ${brief.shopName}
- Trade: ${brief.nicheDisplayName}
- Mood the maker chose: ${brief.moodLabel} — ${brief.moodDescription}

THE NICHE — who this kind of maker is and who buys from them. Read all of it; it shows the full range of the category, not one stereotype:
${niche}${makerWorkClause}

Call set_trajectory with five fields:
- feeling: the single feeling the whole store should leave a visitor with, in one line.
- customerWhy: why someone chooses a ${brief.nicheDisplayName.toLowerCase()}'s work.
- visualWorld: the look and feel the store should have, within the ${brief.moodLabel} mood.
- momentConcept: the concept for the hero moment.
- register: "loud" or "restrained".
- momentKind: 'video' or 'spotlight'. The Moment is BohdiAI's signature, so it MUST be cinematic — but cinematic is not always video. Pick 'video' when the maker's craft contains real ambient motion you can capture in 5 seconds (steam off bread, a candle flame, water moving, hands at work, dust in light, a kiln's glow). Pick 'spotlight' when the product is at rest and you would have to INVENT motion to fill the time (a sticker, a print, a finished piece of jewelry). The criterion is the test: am I capturing motion that's really there, or am I making it up? A held cinematic still always beats invented motion — and spotlight gives that still a cinematic frame (the object rises from black, the camera slowly pushes in, the words fade in over).

Set the trajectory now.`;
}

export const __buildDirectorPromptForTest = buildDirectorPrompt;

/** Run the Director: niche + mood in, one validated Trajectory out. */
export async function direct(brief: CrewBrief): Promise<Trajectory> {
  const system = buildDirectorPrompt(brief);
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: 'Set the trajectory. Call set_trajectory.' },
  ];
  let lastIssues = '';

  for (let attempt = 0; attempt < 2; attempt++) {
    const resp = await withTimeout(
      anthropicClient().messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system,
        tools: [SET_TRAJECTORY_TOOL],
        tool_choice: { type: 'tool', name: 'set_trajectory' },
        messages,
      }),
      TIMEOUT_MS,
      'director',
    );

    const tu = resp.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (!tu) throw new Error('Director did not call set_trajectory');

    const parsed = TrajectorySchema.safeParse(tu.input);
    if (parsed.success) {
      logger.info('crew: trajectory set', { feeling: parsed.data.feeling, register: parsed.data.register });
      return parsed.data;
    }

    const issues = parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    lastIssues = issues.map((i) => `${i.path}: ${i.message}`).join('; ');
    messages.push({ role: 'assistant', content: resp.content });
    messages.push({
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: tu.id, is_error: true, content: JSON.stringify({ ok: false, issues }) }],
    });
  }

  throw new Error(`Director did not produce a valid trajectory. Last issues: ${lastIssues}`);
}
