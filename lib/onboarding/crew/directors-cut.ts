/**
 * The Director's Cut (Bohdi again). The coherence guarantee (D40): after the crew
 * finishes, Bohdi reviews every piece against the trajectory and adjusts whatever
 * fights it or fights another piece — type fighting the video, a flat line, an
 * off-trajectory image.
 *
 * No bias: the trajectory is the only yardstick. The pass judges coherence TO the
 * trajectory and internal consistency, never our taste ("punchier", "bolder").
 *
 * It revises whole artifacts (copy / moment / look), each re-validated through the
 * same schemas and gates as its author; any artifact it doesn't return is kept
 * unchanged. The skin stays gated to the mood subset and every product keeps an
 * image prompt, even after a revision.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';
import { withTimeout } from '@/lib/with-timeout';
import { SKIN_DESCRIPTIONS } from '@/lib/archetypes/main-street/skins';
import { moodAlignedSkins } from '@/lib/archetypes/main-street/skin-selection';
import { CopywriterDraftSchema } from './copywriter-schema';
import { MomentSceneSchema } from './cinematographer';
import { GraphicSpecSchema } from './graphic-artist';
import { normalizeCopy } from './normalize-copy';
import type { Trajectory } from './trajectory';
import type { CrewBrief, CrewOutput } from './types';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 12000;
const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 120_000;

const FINAL_CUT_TOOL: Anthropic.Tool = {
  name: 'final_cut',
  description: 'Lock the final cut. Return only the pieces you revised. Returns { ok: true } or { ok: false, issues: [...] } to fix and resubmit.',
  input_schema: { type: 'object', properties: {}, additionalProperties: true },
};

function buildDirectorsCutPrompt(trajectory: Trajectory, current: CrewOutput, subset: string[]): string {
  return `You are Bohdi again, doing the DIRECTOR'S CUT. Your crew has finished. Your one job is the coherence pass: does it all land as ONE feeling — the trajectory you set — and do the pieces serve each other?

THE TRAJECTORY
- feeling: ${trajectory.feeling}
- why the customer wants this: ${trajectory.customerWhy}
- visual world: ${trajectory.visualWorld}
- the moment: ${trajectory.heroConcept}
- type register: ${trajectory.register}

THE COPY (every word):
${JSON.stringify(current.copy, null, 2)}

THE MOMENT (hero ${current.moment.kind}):
${JSON.stringify(current.moment, null, 2)}

THE LOOK (skin: ${current.look.skinKey} — ${SKIN_DESCRIPTIONS[current.look.skinKey] ?? current.look.skinKey}):
${JSON.stringify(current.look, null, 2)}

Call final_cut. For any piece that fights the trajectory or another piece, return a revised version of THAT piece — "copy", "moment", and/or "look" — in the exact same shape, changed only where needed and otherwise identical. Leave a piece out entirely if it already serves the trajectory. If everything coheres, call final_cut with no pieces. Put a one-line reason in "notes".

Constraints that still hold after any revision: the skin must stay one of the mood's skins (${subset.join(', ')}); story lines carry no punctuation; every product keeps exactly one image prompt.`;
}

/** Run the Director's Cut: revise the crew's pieces for coherence with the
 *  trajectory, or pass them through unchanged. */
export async function directorsCut(brief: CrewBrief, trajectory: Trajectory, current: CrewOutput): Promise<CrewOutput> {
  const subset = moodAlignedSkins(brief.moodKey);
  const subsetSet = new Set(subset);
  const system = buildDirectorsCutPrompt(trajectory, current, subset);
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: 'Do the final cut. Call final_cut.' },
  ];
  let lastIssues = '';

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const resp = await withTimeout(
      anthropicClient().messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system,
        tools: [FINAL_CUT_TOOL],
        tool_choice: { type: 'tool', name: 'final_cut' },
        messages,
      }),
      TIMEOUT_MS,
      'directors-cut',
    );

    const tu = resp.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (!tu) throw new Error("Director's Cut did not call final_cut");

    const input = (tu.input ?? {}) as { copy?: unknown; moment?: unknown; look?: unknown };
    const issues: Array<{ path: string; message: string }> = [];

    let nextCopy = current.copy;
    if (input.copy !== undefined) {
      const c = CopywriterDraftSchema.safeParse(input.copy);
      // Normalize any revised copy the same way the Copywriter's output is
      // normalized so a Director's Cut revision can't reintroduce headline /
      // story-line punctuation that the build would otherwise carry forward.
      if (c.success) nextCopy = normalizeCopy(c.data);
      else for (const i of c.error.issues) issues.push({ path: `copy.${i.path.join('.')}`, message: i.message });
    }
    let nextMoment = current.moment;
    if (input.moment !== undefined) {
      const m = MomentSceneSchema.safeParse(input.moment);
      if (m.success) nextMoment = m.data;
      else for (const i of m.error.issues) issues.push({ path: `moment.${i.path.join('.')}`, message: i.message });
    }
    let nextLook = current.look;
    if (input.look !== undefined) {
      const l = GraphicSpecSchema.safeParse(input.look);
      if (l.success) nextLook = l.data;
      else for (const i of l.error.issues) issues.push({ path: `look.${i.path.join('.')}`, message: i.message });
    }

    // Gates on the FINAL triple — catches a revised skin leaving the subset, or a
    // revised copy whose product slugs no longer match the look's image prompts.
    if (issues.length === 0) {
      if (!subsetSet.has(nextLook.skinKey)) {
        issues.push({ path: 'look.skinKey', message: `must be one of the mood's skins: ${subset.join(', ')}` });
      }
      const wantSlugs = nextCopy.products.map((p) => p.slug);
      const gotSlugs = nextLook.products.map((p) => p.slug);
      const gotSet = new Set(gotSlugs);
      const missing = wantSlugs.filter((s) => !gotSet.has(s));
      const extra = gotSlugs.filter((s) => !new Set(wantSlugs).has(s));
      if (missing.length > 0) issues.push({ path: 'look.products', message: `missing image prompts for: ${missing.join(', ')}` });
      if (extra.length > 0) issues.push({ path: 'look.products', message: `unknown product slugs: ${extra.join(', ')}` });
      if (gotSlugs.length !== gotSet.size) issues.push({ path: 'look.products', message: 'duplicate product slugs' });
    }

    if (issues.length === 0) {
      logger.info('crew: final cut', {
        revised: [input.copy !== undefined && 'copy', input.moment !== undefined && 'moment', input.look !== undefined && 'look'].filter(Boolean),
      });
      return { copy: nextCopy, moment: nextMoment, look: nextLook };
    }

    lastIssues = issues.map((i) => `${i.path}: ${i.message}`).join('; ');
    messages.push({ role: 'assistant', content: resp.content });
    messages.push({
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: tu.id, is_error: true, content: JSON.stringify({ ok: false, issues: issues.slice(0, 14) }) }],
    });
  }

  throw new Error(`Director's Cut did not settle within ${MAX_ATTEMPTS} attempts. Last issues: ${lastIssues}`);
}
