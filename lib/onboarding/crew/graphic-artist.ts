/**
 * The Graphic Artist. Gives the store its visual surface: (a) picks the skin —
 * GATED to the mood-aligned subset (D41), so a modern shop can't land a cozy-craft
 * skin — and (b) directs the photography, writing the founder portrait prompt and
 * a product image prompt for each product so every still sits in the same world as
 * the Moment and the skin.
 *
 * No bias: the direction is the trajectory, the story, and the Moment the
 * cinematographer shot. The skin choices are the maker's mood-aligned subset, each
 * with its own fixed description — the artist picks freely within it. The prompt
 * never names a grade or palette to use; coherence with the established Moment and
 * skin is the only instruction, and the engine still owns who the maker is (name +
 * realism) at generation time.
 *
 * Forced single tool use; the skin pick is hard-validated against the subset and
 * the product prompts against the copywriter's slugs; short retry loop; timeout.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';
import { withTimeout } from '@/lib/with-timeout';
import { SKIN_DESCRIPTIONS } from '@/lib/archetypes/main-street/skins';
import { moodAlignedSkins } from '@/lib/archetypes/main-street/skin-selection';
import type { Trajectory } from './trajectory';
import type { MomentScene } from './cinematographer';
import type { ProductDraft } from './copywriter-schema';
import type { CrewBrief } from './types';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 4000;
const MAX_ATTEMPTS = 4;
// 60s per-call. Stage sum must stay under the 300s route ceiling (see
// pipeline.ts PIPELINE_DEADLINE_MS + guard test).
export const TIMEOUT_MS = 60_000;

/** What the Graphic Artist produces. `skinKey` is validated against the subset
 *  separately (a dynamic set), and `products` must cover the copywriter's slugs. */
// The image prompts feed the image model (not rendered) — no length cap, only a
// non-empty floor. `alt` is the accessibility caption (read by assistive tech,
// never laid out), so it carries no length cap either — copy never fails the
// build (D53). `slug` is a routing identifier.
export const GraphicSpecSchema = z.object({
  skinKey: z.string(),
  founderPhoto: z.object({
    prompt: z.string().min(1),
    alt: z.string().min(4),
  }),
  products: z
    .array(z.object({ slug: z.string().min(2).max(48), imagePrompt: z.string().min(1) }))
    .min(1),
});
export type GraphicSpec = z.infer<typeof GraphicSpecSchema>;

const SET_LOOK_TOOL: Anthropic.Tool = {
  name: 'set_look',
  description: 'Pick the skin and direct the photography. Returns { ok: true } or { ok: false, issues: [...] } to fix and resubmit.',
  input_schema: { type: 'object', properties: {}, additionalProperties: true },
};

function buildGraphicArtistPrompt(
  brief: CrewBrief,
  trajectory: Trajectory,
  story: string[],
  scene: MomentScene,
  products: ProductDraft[],
  subset: string[],
): string {
  const lines = story.map((l) => `  ${l}`).join('\n');
  const sceneLines = [
    `  composition: ${scene.prompt.composition}`,
    `  subject: ${scene.prompt.subject}`,
    `  environment: ${scene.prompt.environment}`,
    `  atmosphere: ${scene.prompt.atmosphere}`,
    `  lighting: ${scene.prompt.lighting}`,
    `  style: ${scene.prompt.style}`,
  ].join('\n');
  const skinList = subset.map((k) => `    - ${k}: ${SKIN_DESCRIPTIONS[k] ?? k}`).join('\n');
  const productList = products.map((p, i) => `  ${i + 1}. ${p.name} (slug: ${p.slug}) — ${p.shortDescription}`).join('\n');

  return `You are the GRAPHIC ARTIST on Bohdi's crew. You give the store its visual surface: you pick the skin (its colors and type) and you direct the photography so every still sits in the same world as the Moment. Build to the trajectory, the story, and the Moment the cinematographer shot.

THE TRAJECTORY
- feeling: ${trajectory.feeling}
- visual world: ${trajectory.visualWorld}
- type register: ${trajectory.register}
- the moment: ${trajectory.heroConcept}

THE MOMENT (the ${scene.kind} the photos must sit beside):
${sceneLines}

THE STORY:
${lines}

THE PRODUCTS to photograph:
${productList}

Choose with set_look:
- skinKey: the store's skin. Pick exactly ONE key from this list — these are the skins that fit the ${brief.moodLabel} mood the maker chose:
${skinList}
- founderPhoto: the maker AT WORK — framed on their hands and their craft at the bench, NOT their face. Never specify the maker's gender, age, or appearance (no "a man", "a woman", "bearded", etc.) — the maker adds their own real photo later; this placeholder is about the work, not the person. { prompt: the setting, framing, and light of the shot; alt: a short, plain description of the shot }. The system enforces the maker's framing and realism; you set the scene and its light.
- products: an image prompt for EVERY product above — an array of { slug, imagePrompt }, one entry per slug, no extras: the product shot, its surface, and its light, in the same world as the Moment and the skin.

Set the look now.`;
}

/** Run the Graphic Artist: trajectory + story + moment + products in, one
 *  validated visual spec out (skin gated to the mood subset; prompts cover every
 *  product). */
export async function designLook(
  brief: CrewBrief,
  trajectory: Trajectory,
  story: string[],
  scene: MomentScene,
  products: ProductDraft[],
): Promise<GraphicSpec> {
  const subset = moodAlignedSkins(brief.moodKey);
  const subsetSet = new Set(subset);
  const wantSlugs = products.map((p) => p.slug);
  const wantSet = new Set(wantSlugs);

  const system = buildGraphicArtistPrompt(brief, trajectory, story, scene, products, subset);
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: 'Pick the skin and direct the photos. Call set_look.' },
  ];
  let lastIssues = '';

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const resp = await withTimeout(
      anthropicClient().messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system,
        tools: [SET_LOOK_TOOL],
        tool_choice: { type: 'tool', name: 'set_look' },
        messages,
      }),
      TIMEOUT_MS,
      'graphic-artist',
    );

    const tu = resp.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (!tu) throw new Error('Graphic Artist did not call set_look');

    const issues: Array<{ path: string; message: string }> = [];
    const parsed = GraphicSpecSchema.safeParse(tu.input);
    if (parsed.success) {
      // The D41 gate: the skin MUST be one of the mood-aligned subset.
      if (!subsetSet.has(parsed.data.skinKey)) {
        issues.push({ path: 'skinKey', message: `must be one of the listed skins: ${subset.join(', ')}` });
      }
      // Every product must get exactly one image prompt — no gaps, no extras.
      const gotSlugs = parsed.data.products.map((p) => p.slug);
      const gotSet = new Set(gotSlugs);
      const missing = wantSlugs.filter((s) => !gotSet.has(s));
      const extra = gotSlugs.filter((s) => !wantSet.has(s));
      if (missing.length > 0) issues.push({ path: 'products', message: `missing image prompts for: ${missing.join(', ')}` });
      if (extra.length > 0) issues.push({ path: 'products', message: `unknown product slugs: ${extra.join(', ')}` });
      if (gotSlugs.length !== gotSet.size) issues.push({ path: 'products', message: 'duplicate product slugs' });

      if (issues.length === 0) {
        logger.info('crew: look designed', { skin: parsed.data.skinKey, products: parsed.data.products.length });
        return parsed.data;
      }
    } else {
      for (const i of parsed.error.issues) issues.push({ path: i.path.join('.'), message: i.message });
    }

    lastIssues = issues.map((i) => `${i.path}: ${i.message}`).join('; ');
    messages.push({ role: 'assistant', content: resp.content });
    messages.push({
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: tu.id, is_error: true, content: JSON.stringify({ ok: false, issues: issues.slice(0, 14) }) }],
    });
  }

  throw new Error(`Graphic Artist did not produce a valid look within ${MAX_ATTEMPTS} attempts. Last issues: ${lastIssues}`);
}
