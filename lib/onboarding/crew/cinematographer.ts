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
 * The kind decision belongs to the DIRECTOR (trajectory.heroKind, see director.ts);
 * this stage executes whichever kind was called for. Video carries real ambient motion
 * belonging to the subject; a still hero is rendered as a cinematic SCENE (the product
 * in its world, with a very subtle CSS push-in at render). The hero is always
 * cinematic — cinematic is not always video.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';
import { withTimeout } from '@/lib/with-timeout';
import { ScenePrompt, CollageShot } from '@/lib/archetypes/main-street/schemas';
import { buildResubmitPayload } from './length-feedback';
import type { Trajectory } from './trajectory';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1500;
const MAX_ATTEMPTS = 4;
export const TIMEOUT_MS = 60_000;

/** What the Cinematographer produces — the hero media slot minus the resolved
 *  urls (generated later). Reuses ScenePrompt so its limits never drift from the
 *  engine that finally validates the assembled envelope. */
export const MomentSceneSchema = z.object({
  kind: z.enum(['video', 'still']),
  prompt: ScenePrompt,
  // No hard cap: `alt` is the accessibility caption (never laid out), so its
  // length can't break anything and must never fail the build (D53). The min is
  // a quality floor; a soft prompt nudge keeps it short without a gate.
  alt: z.string().min(4),
  // The Collage hero's three still scenes — designed alongside the hero so the
  // pantry is full and a swap to Collage is instant. OPTIONAL on purpose: the
  // prompt asks for three, but a miss degrades gracefully (Collage shows fewer /
  // none) rather than failing the build (D53/D57). Generated as stills later;
  // no url here. These are NOT frames of the hero clip — they are their own
  // shots of the maker's world, varied from the hero and from each other.
  collageShots: z.array(CollageShot).optional(),
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

/**
 * The seven-phrase rendered-frame prompt, published to Anthropic so the model
 * doesn't have to guess the shape. Reused for each collageShots entry.
 */
const SCENE_PROMPT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    composition: { type: 'string' },
    subject: { type: 'string' },
    environment: { type: 'string' },
    atmosphere: { type: 'string' },
    camera: { type: 'string' },
    lighting: { type: 'string' },
    style: { type: 'string' },
  },
  required: ['composition', 'subject', 'environment', 'atmosphere', 'camera', 'lighting', 'style'],
};

/**
 * The JSON schema published to Anthropic as `set_moment`'s input_schema.
 *
 * MUST MIRROR MomentSceneSchema above. Zod stays the runtime source of truth
 * (physics guards — text-in-frame, camera-movement, director-kind cross-check —
 * still run after parse). Shape only: no length caps on `alt`, no min on
 * `collageShots` (author-authored quality floor is a graceful degrade, not a
 * hard fail).
 */
export const MOMENT_TOOL_INPUT_SCHEMA = {
  type: 'object',
  properties: {
    kind: { type: 'string', enum: ['video', 'still'] },
    prompt: SCENE_PROMPT_JSON_SCHEMA,
    alt: { type: 'string' },
    collageShots: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          prompt: SCENE_PROMPT_JSON_SCHEMA,
          alt: { type: 'string' },
        },
        required: ['prompt', 'alt'],
      },
    },
  },
  required: ['kind', 'prompt', 'alt'],
} satisfies { type: 'object'; properties: Record<string, unknown>; required: string[] };

const SET_MOMENT_TOOL: Anthropic.Tool = {
  name: 'set_moment',
  description: 'Design the Moment hero shot. Returns { ok: true } or { ok: false, issues: [...] } to fix and resubmit.',
  input_schema: MOMENT_TOOL_INPUT_SCHEMA,
};

export function buildCinematographerPrompt(trajectory: Trajectory, story: string[]): string {
  const lines = story.map((l) => `  ${l}`).join('\n');
  return `You are the CINEMATOGRAPHER on Bohdi's crew. You design the HERO — one large 16:9 shot that opens the store. Build it to the trajectory and to the story the copywriter wrote, so the shot carries the same feeling as the words.

THE TRAJECTORY
- feeling: ${trajectory.feeling}
- why the customer wants this: ${trajectory.customerWhy}
- visual world: ${trajectory.visualWorld}
- the hero: ${trajectory.heroConcept}

THE STORY that lands over the hero:
${lines}

The director has called for a ${trajectory.heroKind.toUpperCase()} hero for this shop. Build the shot accordingly. Set kind to "${trajectory.heroKind}". Do not second-guess this — the director judged the inventing-motion criterion against the trajectory; your job is to execute that call into a great shot.

Design the shot with set_moment:
- kind: set to "${trajectory.heroKind}" as the director called.
- prompt: the shot as seven short phrases —
    - composition: how the shot is framed.
    - subject: what is in frame.
    - environment: where it is.
    - atmosphere: the feeling in the air.
    - camera: the angle and lens. For a video the camera is LOCKED — a fixed, static setup. Name no movement: no pan, push-in, zoom, dolly, crane, orbit, rack focus, or drift. (A moving camera can't loop — see below.) For a still the camera is also static; the renderer adds a very subtle CSS push-in at render, not the image.
    - lighting: the light.
    - style: the visual style.
- alt: a short, plain description of the shot — a sentence is plenty.

- collageShots: ALSO design exactly THREE still scenes for an alternate hero layout (a photo collage). Each is its own { prompt (the same seven groups), alt }. These are ALWAYS stills (no video, no loop concerns) and must be VARIED — different subjects, angles, and distances from the hero shot AND from each other (e.g. a wide of the workspace, a close detail, a small grouping of the goods), so the three read as a lively cluster rather than three takes of one thing. Same world and feeling as the hero. Same no-text rule applies. (If you truly cannot, omit collageShots — but three good ones are expected.)

- No text, lettering, logos, titles, captions, or typography anywhere in the frame — the engine sets the type; the shot is image only. (A physics rule: image models can't render legible text.)

If kind is "video": it is a short clip that LOOPS seamlessly. Two things follow, both physics:
- The CAMERA is locked. The motion comes from WITHIN the frame — drifting light, rising steam, a flame's flicker, fabric or dust stirring, a slow shimmer on a glaze — never from the camera. A camera that moves (pans, pushes in, zooms, racks focus, drifts) travels away from its start frame and the loop jumps on restart. Hold the camera still and let the scene move.
- The in-frame motion is continuous and ambient — no progressive human action and no large change in light or position across the clip, or the restart will jump. A motionless person is fine (hands at rest, a figure standing still); a person performing an action is not.

If kind is "still": video is the default for the Moment (D33, D47), and a still is the fallback the director reached for because the subject genuinely cannot offer ambient motion in 5 seconds. Treat it that way — make the still work without trying to make it the prettier choice. The product sits in its real environment (a sink, a windowsill, a workbench, a table, a studio corner, a counter), not on a void. The composition has some depth and air around the product. The lighting is natural and directional. The 'environment' phrase must describe a real space; pure black or any solid void is forbidden — that reads as a product card and we are explicitly NOT building that.

LIGHTING for a still is physics: the scene must be clearly lit with directional light that gives the product separation from its surroundings — a key from the side or above-front, a softer fill, the product visibly modeled (highlights on one side, soft shadow on the other). Even when the trajectory calls for a moody atmosphere, the product itself must be readable — never let it disappear into shadow. The atmosphere lives in the room, the light, and the air around the product, not in flattening the product itself.

Set the moment now.`;
}

export const __buildCinematographerPromptForTest = buildCinematographerPrompt;

/** Run the Cinematographer: trajectory + story in, one validated Moment scene out. */
export async function shootMoment(trajectory: Trajectory, story: string[]): Promise<MomentScene> {
  const system = buildCinematographerPrompt(trajectory, story);
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: 'Design the Moment. Call set_moment.' },
  ];
  let lastIssues = '';

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const resp = await withTimeout(
      (signal) =>
        anthropicClient().messages.create(
          {
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system,
            tools: [SET_MOMENT_TOOL],
            tool_choice: { type: 'tool', name: 'set_moment' },
            messages,
          },
          { signal },
        ),
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
      // Belt-and-suspenders: the director's kind call is already in the prompt,
      // but validate that the model actually set it — a misread directive would
      // silently produce the wrong Moment kind if we don't cross-check here.
      const kindMismatch =
        parsed.data.kind !== trajectory.heroKind
          ? `the director called for a ${trajectory.heroKind} Moment, but you set kind to "${parsed.data.kind}". Match the director's call: set kind to "${trajectory.heroKind}".`
          : null;
      if (textHits.length === 0 && !cameraHit && !kindMismatch) {
        logger.info('crew: moment shot', { kind: parsed.data.kind });
        return parsed.data;
      }
      // Physics failures (text the image model can't render; a moving camera that
      // breaks the loop) and directive failures (the model set the wrong kind).
      // Treat all like a validation failure and ask for a reshoot.
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
        ...(kindMismatch ? [{ path: 'kind', message: kindMismatch }] : []),
      ];
      lastIssues = issues.map((i) => `${i.path}: ${i.message}`).join('; ');
      messages.push({ role: 'assistant', content: resp.content });
      messages.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: tu.id, is_error: true, content: JSON.stringify({ ok: false, issues }) }],
      });
      continue;
    }

    const payload = buildResubmitPayload(parsed.error, tu.input);
    lastIssues = payload.issues.map((i) => `${i.path}: ${i.message}`).join('; ');
    messages.push({ role: 'assistant', content: resp.content });
    messages.push({
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: tu.id, is_error: true, content: JSON.stringify(payload) }],
    });
  }

  throw new Error(`Cinematographer did not produce a valid moment within ${MAX_ATTEMPTS} attempts. Last issues: ${lastIssues}`);
}
