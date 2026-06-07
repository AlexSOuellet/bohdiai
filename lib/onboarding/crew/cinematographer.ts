/**
 * The Cinematographer. Designs the Moment — the hero of the front door — from the
 * trajectory and the copywriter's story, so the shot carries the same feeling as
 * the words (D40). Produces the structured scene (the seven fixed groups the
 * engine already renders), the video-or-still decision, and the alt text.
 *
 * No bias: the direction is the trajectory and the story. The prompt names the
 * scene groups STRUCTURALLY (what kind of info each holds) and states the loop
 * PHYSICS for a video (a seamless loop cannot contain progressive action or a big
 * light change without jumping on restart) — physics, not taste. It never says go
 * low-light, go cinematic, or prefer video; the video/still choice is left neutral
 * and follows the concept. (Failure fallback to a still is the pipeline's job, not
 * a creative default here.)
 */
import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';
import { withTimeout } from '@/lib/with-timeout';
import { ScenePrompt } from '@/lib/archetypes/main-street/schemas';
import type { Trajectory } from './trajectory';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1500;
const MAX_ATTEMPTS = 4;
const TIMEOUT_MS = 60_000;

/** What the Cinematographer produces — the hero media slot minus the resolved
 *  urls (generated later). Reuses ScenePrompt so its limits never drift from the
 *  engine that finally validates the assembled envelope. */
export const MomentSceneSchema = z.object({
  kind: z.enum(['video', 'image']),
  prompt: ScenePrompt,
  alt: z.string().min(4).max(120),
});
export type MomentScene = z.infer<typeof MomentSceneSchema>;

const SET_MOMENT_TOOL: Anthropic.Tool = {
  name: 'set_moment',
  description: 'Design the Moment hero shot. Returns { ok: true } or { ok: false, issues: [...] } to fix and resubmit.',
  input_schema: { type: 'object', properties: {}, additionalProperties: true },
};

function buildCinematographerPrompt(trajectory: Trajectory, story: string[]): string {
  const lines = story.map((l) => `  ${l}`).join('\n');
  return `You are the CINEMATOGRAPHER on Bohdi's crew. You design the Moment — the hero of the front door, one large 16:9 shot that opens the store. Build it to the trajectory and to the story the copywriter wrote, so the shot carries the same feeling as the words.

THE TRAJECTORY
- feeling: ${trajectory.feeling}
- why the customer wants this: ${trajectory.customerWhy}
- visual world: ${trajectory.visualWorld}
- the moment: ${trajectory.momentConcept}

THE STORY that plays over the Moment:
${lines}

Design the shot with set_moment. The fields and their hard limits (stay under — short phrases, not sentences):
- kind: "video" or "image".
- prompt: the shot as seven short phrases —
    - composition (3-160): how the shot is framed.
    - subject (3-160): what is in frame.
    - environment (3-160): where it is.
    - atmosphere (3-120): the feeling in the air.
    - camera (3-120): the angle, lens, and any movement.
    - lighting (3-120): the light.
    - style (3-120): the visual style.
- alt (4-120): a plain description of the shot.

If kind is "video": it is a short clip that LOOPS seamlessly, so the motion must be continuous and ambient — no progressive human action and no large change in light or position across the clip, or the restart will jump. A motionless person is fine (hands at rest, a figure standing still); a person performing an action is not.

Set the moment now.`;
}

/** Run the Cinematographer: trajectory + story in, one validated Moment scene out. */
export async function shootMoment(trajectory: Trajectory, story: string[]): Promise<MomentScene> {
  const system = buildCinematographerPrompt(trajectory, story);
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: 'Design the Moment. Call set_moment.' },
  ];
  let lastIssues = '';

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const resp = await withTimeout(
      anthropicClient().messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system,
        tools: [SET_MOMENT_TOOL],
        tool_choice: { type: 'tool', name: 'set_moment' },
        messages,
      }),
      TIMEOUT_MS,
      'cinematographer',
    );

    const tu = resp.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (!tu) throw new Error('Cinematographer did not call set_moment');

    const parsed = MomentSceneSchema.safeParse(tu.input);
    if (parsed.success) {
      logger.info('crew: moment shot', { kind: parsed.data.kind });
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

  throw new Error(`Cinematographer did not produce a valid moment within ${MAX_ATTEMPTS} attempts. Last issues: ${lastIssues}`);
}
