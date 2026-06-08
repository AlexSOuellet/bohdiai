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

/** Words that mean the shot is asking the image model to render lettering — which
 *  it can't do legibly and which the engine owns via the wordmark. A physics guard,
 *  not taste. Scoped to the seven prompt phrases that describe the rendered frame
 *  (not `alt`, which is a plain caption and may legitimately use these words). */
const TEXT_WORDS = ['title', 'text', 'lettering', 'typography', 'wordmark', 'logo', 'caption', 'headline'] as const;
const TEXT_WORD_RE = new RegExp(`\\b(${TEXT_WORDS.join('|')})s?\\b`, 'i');

/** Scan the rendered-frame phrases for any text-requesting word. Returns the
 *  offending `field: word` hits, or [] if the shot is clean. */
function findTextRequests(prompt: MomentScene['prompt']): string[] {
  return (Object.entries(prompt) as Array<[string, string]>)
    .map(([field, phrase]): string | null => {
      const m = TEXT_WORD_RE.exec(phrase);
      return m ? `${field}: "${m[0]}"` : null;
    })
    .filter((hit): hit is string => hit !== null);
}

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

Design the shot with set_moment:
- kind: "video" or "image".
- prompt: the shot as seven short phrases —
    - composition: how the shot is framed.
    - subject: what is in frame.
    - environment: where it is.
    - atmosphere: the feeling in the air.
    - camera: the angle, lens, and any movement.
    - lighting: the light.
    - style: the visual style.
- alt (4-120): a plain description of the shot.

- No text, lettering, logos, titles, captions, or typography anywhere in the frame — the engine sets the type; the shot is image only. (A physics rule: image models can't render legible text.)

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
      const textHits = findTextRequests(parsed.data.prompt);
      if (textHits.length === 0) {
        logger.info('crew: moment shot', { kind: parsed.data.kind });
        return parsed.data;
      }
      // The shot asked the image model to render lettering — a physics failure.
      // Treat it like a validation failure and ask for a clean reshoot.
      const issues = textHits.map((hit) => ({
        path: `prompt.${hit.split(':')[0]}`,
        message: `No text, lettering, titles, logos, or typography in the frame — the engine sets the type. Remove the lettering at ${hit} and reshoot the shot as image only.`,
      }));
      lastIssues = issues.map((i) => `${i.path}: ${i.message}`).join('; ');
      messages.push({ role: 'assistant', content: resp.content });
      messages.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: tu.id, is_error: true, content: JSON.stringify({ ok: false, issues }) }],
      });
      continue;
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
