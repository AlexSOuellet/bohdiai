/**
 * The scene maker (Alex, Session 107): every Scenic build makes the photos behind
 * its page from the site being built, and adds them to the scene library, tagged
 * and searchable, so any Scenic site can use them later.
 *
 *   1. Claude writes picture descriptions from the maker's own words: calm, wide
 *      places that suit their work, quiet across the top where the name sits.
 *   2. fal.ai paints each one, then enlarges it to full-screen size.
 *   3. The photo is measured: a dark one takes light lettering (`tone`).
 *
 * Claude's and fal's clients are passed in, so tests run without either.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod/v4';
import sharp from 'sharp';
import { SCENE_KEY } from '@/lib/archetypes/main-street/scenes';
import { DRAFT_MODEL } from './intake-drafts';

/** How many photos a Scenic build makes, at least and at most (Alex: two to four). */
export const SCENES_MIN = 2;
export const SCENES_MAX = 4;
export const SCENES_DEFAULT = 3;

/** The full-screen size a scene is saved at. */
export const SCENE_WIDTH = 2048;
export const SCENE_HEIGHT = 1152;

/** Below this average brightness across the top of the photo (0–255, where the
 *  name sits), the photo counts as dark. */
export const DARK_BELOW = 105;

/** What the maker told us, as the picture descriptions are written from it. */
export type SceneBrief = { businessName: string; makes: string; about: string };

/** One planned scene: what to paint, and the words it's found by. */
export type ScenePlan = { picture: string; tags: string[] };

const planSchema = (count: number) =>
  z.object({
    scenes: z
      .array(
        z.object({
          picture: z.string().min(40).max(1200),
          tags: z.array(z.string().min(2).max(30)).min(3).max(10),
        }),
      )
      .length(count),
  });

export function sceneSystemPrompt(): string {
  return [
    'You plan the background photographs for a maker’s website. Each photograph is fixed behind the whole page while the maker’s name, headings and photos of their work float over it on light panels, so it must stay calm and give way to everything in front of it.',
    'Write a description for an image model to paint. Each one is a wide, landscape, photographic view of a real-feeling place that suits this maker’s work and the world it comes from. Keep the upper two thirds open, quiet and softly lit, with no strong detail, because the name sits there; any detail sits low in the frame. Natural light, gentle depth of field, muted colour.',
    'Never show people, hands, faces, text, signs, logos or brand names, and never try to show the maker’s own pieces: their real photos sit on top of this one.',
    'When asked for several, make them clearly different from each other: a different place, time of day or light, so the maker has a real choice.',
    'Tag each with three to ten lowercase words someone would search a photo library by: the kind of place, what is in it, the light and time of day, and the kinds of work it suits. Single words or short phrases, no punctuation.',
  ].join('\n\n');
}

export function sceneRequest(brief: SceneBrief, count: number): string {
  return [
    `Plan ${count} background photographs for this maker’s site.`,
    `Business: ${brief.businessName}`,
    `What they make, in their words: ${brief.makes}`,
    `About them, in their words: ${brief.about}`,
  ].join('\n\n');
}

/** Tags as the library keeps them: lowercase, trimmed, no repeats. */
export function cleanTags(tags: readonly string[]): string[] {
  return [...new Set(tags.map((t) => t.trim().toLowerCase().replace(/[^\p{L}\p{N} -]/gu, '').replace(/\s+/g, ' ')).filter((t) => t !== ''))];
}

/** Claude plans the pictures. */
export async function planScenes(
  client: Pick<Anthropic, 'messages'>,
  brief: SceneBrief,
  count: number,
): Promise<{ ok: true; scenes: ScenePlan[] } | { ok: false; error: string }> {
  if (count < SCENES_MIN || count > SCENES_MAX) return { ok: false, error: `a Scenic build makes ${SCENES_MIN} to ${SCENES_MAX} photos, not ${count}` };
  const response = await client.messages.parse({
    model: DRAFT_MODEL,
    max_tokens: 16000,
    system: sceneSystemPrompt(),
    messages: [{ role: 'user', content: sceneRequest(brief, count) }],
    output_config: { effort: 'medium', format: zodOutputFormat(planSchema(count)) },
  });
  if (response.stop_reason === 'refusal') return { ok: false, error: 'Claude declined to plan the background photos' };
  if (response.stop_reason === 'max_tokens') return { ok: false, error: 'the background photo plans ran out of room' };
  const parsed = response.parsed_output;
  if (parsed === null || parsed === undefined) return { ok: false, error: 'the background photo plans didn’t come back in shape' };
  return { ok: true, scenes: parsed.scenes.map((s) => ({ picture: s.picture.trim(), tags: cleanTags(s.tags) })) };
}

/** The painter: turns a description into a wide photo, then enlarges it. */
export type ScenePainter = {
  paint: (picture: string) => Promise<Buffer>;
  enlarge: (photo: Buffer) => Promise<Buffer>;
};

/** A photo saved at full-screen size, and whether it reads dark where the name sits. */
export async function finishScene(photo: Buffer): Promise<{ webp: Buffer; tone: 'light' | 'dark' }> {
  const sized = sharp(photo).resize(SCENE_WIDTH, SCENE_HEIGHT, { fit: 'cover', kernel: 'lanczos3' });
  const webp = await sized.clone().webp({ quality: 82 }).toBuffer();
  const top = await sharp(webp)
    .extract({ left: 0, top: 0, width: SCENE_WIDTH, height: Math.round(SCENE_HEIGHT * 0.6) })
    .greyscale()
    .stats();
  const mean = top.channels[0]?.mean ?? 255;
  return { webp, tone: mean < DARK_BELOW ? 'dark' : 'light' };
}

/** Free library names for a site's new scenes: "<subdomain>-1", "-2", … skipping any taken. */
export function sceneKeys(subdomain: string, count: number, taken: ReadonlySet<string>): string[] {
  const keys: string[] = [];
  for (let n = 1; keys.length < count; n += 1) {
    const key = `${subdomain}-${n}`;
    if (!taken.has(key)) keys.push(key);
  }
  for (const key of keys) if (!SCENE_KEY.test(key)) throw new Error(`"${key}" can't be a scene name`);
  return keys;
}

/** A scene made for a site, ready for the library. */
export type MadeScene = { key: string; url: string; tone: 'light' | 'dark'; tags: string[]; description: string };

/** Everything the run needs from outside: Claude, the painter, and where photos and rows go. */
export type SceneDeps = {
  client: Pick<Anthropic, 'messages'>;
  painter: ScenePainter;
  /** Saves a finished photo under its library name and returns its public address. */
  store: (key: string, webp: Buffer) => Promise<string>;
  /** Adds the made scenes to the library. */
  add: (scenes: readonly MadeScene[]) => Promise<void>;
};

/** Plan, paint, enlarge, measure and store one photo per key, then add them all to
 *  the library at once. Any failure stops the run and says which step. */
export async function makeScenes(deps: SceneDeps, brief: SceneBrief, keys: readonly string[]): Promise<{ ok: true; scenes: MadeScene[] } | { ok: false; error: string }> {
  const planned = await planScenes(deps.client, brief, keys.length);
  if (!planned.ok) return planned;
  const made: MadeScene[] = [];
  for (const [i, plan] of planned.scenes.entries()) {
    const key = keys[i] as string;
    try {
      const painted = await deps.painter.paint(plan.picture);
      const enlarged = await deps.painter.enlarge(painted);
      const { webp, tone } = await finishScene(enlarged);
      const url = await deps.store(key, webp);
      made.push({ key, url, tone, tags: plan.tags, description: plan.picture });
    } catch (e) {
      return { ok: false, error: `background photo ${i + 1} of ${keys.length} failed: ${e instanceof Error ? e.message : String(e)}` };
    }
  }
  await deps.add(made);
  return { ok: true, scenes: made };
}
