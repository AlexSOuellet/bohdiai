/**
 * The Cinematographer. Designs the Moment — the hero of the front door — from the
 * trajectory and the copywriter's story, so the shot carries the same feeling as
 * the words (D40). Produces the structured scene (the seven fixed groups the
 * engine already renders), the video-or-still decision, and the alt text.
 *
 * No taste-bias: the direction is the trajectory and the story. The prompt names
 * the scene groups STRUCTURALLY (what kind of info each holds) and states the loop
 * PHYSICS for a video (a seamless loop holds the camera LOCKED and takes its motion
 * from within the frame; it cannot contain camera movement, progressive action, or
 * a big light change without jumping on restart) — physics, not taste. It never
 * says go low-light or go cinematic.
 *
 * It DOES prefer video — that is product intent, not taste (D47). The Moment is
 * motion; a BohdiAI front door MOVES where a template builder's sits still (D33).
 * So video is the default and a still is the last resort, chosen only when no
 * simple ambient motion fits. Leaving the choice "neutral" made the model read
 * video's loop restrictions as risk and play safe with stills — neutrality and
 * intent are not the same thing.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';
import { withTimeout } from '@/lib/with-timeout';
import { ScenePrompt } from '@/lib/archetypes/main-street/schemas';
import { lengthAwareIssues } from './length-feedback';
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
  // No hard cap: `alt` is the accessibility caption (never laid out), so its
  // length can't break anything and must never fail the build (D53). The min is
  // a quality floor; a soft prompt nudge keeps it short without a gate.
  alt: z.string().min(4),
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

/** Camera moves that break a seamless loop — the camera travels and can't return
 *  to its start frame, so the restart jumps. A video Moment must hold the camera
 *  still and let the motion come from within the frame. Physics, not taste. Scoped
 *  to the `camera` phrase only (a tilt-shift LENS or "track" elsewhere is fine). */
const CAMERA_MOVES = [
  'pan', 'panning', 'dolly', 'zoom', 'zooming', 'rack focus', 'focus pull', 'pull focus',
  'push in', 'push-in', 'crane', 'orbit', 'orbiting', 'handheld', 'glide', 'gliding',
  'sweep', 'sweeping', 'pull back', 'pull-back', 'drift', 'drifting', 'breathing',
] as const;
const CAMERA_MOVE_RE = new RegExp(`\\b(${CAMERA_MOVES.join('|').replace(/ /g, '\\s')})\\b`, 'i');

/** Find a camera-movement phrase in the camera field, or null if it's a static
 *  setup. Only meaningful for a video (a still doesn't loop). */
function findCameraMovement(camera: string): string | null {
  const m = CAMERA_MOVE_RE.exec(camera);
  return m ? m[0] : null;
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
- kind: "video" or "image". The Moment is motion — that a BohdiAI front door MOVES where a template builder's sits still is the whole point of it. Reach for video by default: almost any scene holds some simple, continuous, ambient motion that loops. Choose a still ONLY when you genuinely cannot find one ambient motion that suits the feeling — a still is the last resort, not an equal option.
- prompt: the shot as seven short phrases —
    - composition: how the shot is framed.
    - subject: what is in frame.
    - environment: where it is.
    - atmosphere: the feeling in the air.
    - camera: the angle and lens. For a video the camera is LOCKED — a fixed, static setup. Name no movement: no pan, push-in, zoom, dolly, crane, orbit, rack focus, or drift. (A moving camera can't loop — see below.)
    - lighting: the light.
    - style: the visual style.
- alt: a short, plain description of the shot — a sentence is plenty.

- No text, lettering, logos, titles, captions, or typography anywhere in the frame — the engine sets the type; the shot is image only. (A physics rule: image models can't render legible text.)

If kind is "video": it is a short clip that LOOPS seamlessly. Two things follow, both physics:
- The CAMERA is locked. The motion comes from WITHIN the frame — drifting light, rising steam, a flame's flicker, fabric or dust stirring, a slow shimmer on a glaze — never from the camera. A camera that moves (pans, pushes in, zooms, racks focus, drifts) travels away from its start frame and the loop jumps on restart. Hold the camera still and let the scene move.
- The in-frame motion is continuous and ambient — no progressive human action and no large change in light or position across the clip, or the restart will jump. A motionless person is fine (hands at rest, a figure standing still); a person performing an action is not.

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
      // A video must loop seamlessly, so its camera must be locked. A still
      // doesn't loop, so camera wording is irrelevant for it.
      const cameraHit = parsed.data.kind === 'video' ? findCameraMovement(parsed.data.prompt.camera) : null;
      if (textHits.length === 0 && !cameraHit) {
        logger.info('crew: moment shot', { kind: parsed.data.kind });
        return parsed.data;
      }
      // Physics failures (text the image model can't render; a moving camera that
      // breaks the loop). Treat like a validation failure and ask for a reshoot.
      const issues = [
        ...textHits.map((hit) => ({
          path: `prompt.${hit.split(':')[0]}`,
          message: `No text, lettering, titles, logos, or typography in the frame — the engine sets the type. Remove the lettering at ${hit} and reshoot the shot as image only.`,
        })),
        ...(cameraHit
          ? [{
              path: 'prompt.camera',
              message: `The Moment loops seamlessly, so the CAMERA must be LOCKED/static — a moving camera (here: "${cameraHit}") travels and can't return to its start frame, so the loop jumps. Hold the camera still and let the motion come from WITHIN the frame (drifting light, rising steam, a slow flicker). Reshoot the camera as a fixed setup.`,
            }]
          : []),
      ];
      lastIssues = issues.map((i) => `${i.path}: ${i.message}`).join('; ');
      messages.push({ role: 'assistant', content: resp.content });
      messages.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: tu.id, is_error: true, content: JSON.stringify({ ok: false, issues }) }],
      });
      continue;
    }

    const issues = lengthAwareIssues(parsed.error, tu.input);
    lastIssues = issues.map((i) => `${i.path}: ${i.message}`).join('; ');
    messages.push({ role: 'assistant', content: resp.content });
    messages.push({
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: tu.id, is_error: true, content: JSON.stringify({ ok: false, issues }) }],
    });
  }

  throw new Error(`Cinematographer did not produce a valid moment within ${MAX_ATTEMPTS} attempts. Last issues: ${lastIssues}`);
}
