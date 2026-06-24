/**
 * The crew pipeline — `directAndProduce`, replacing the single-pass `authorStore`
 * (D40). Code is the stage manager: it runs the five stages in order — Director →
 * Copywriter → Cinematographer → Graphic Artist → Director's Cut — sequentially,
 * for coherence (the cinematographer sees the story; the graphic artist sees the
 * story and the moment). Bohdi "directs" only through the CONTENT of the
 * trajectory; the model never decides control flow.
 *
 * It then assembles the crew's three artifacts into the engine's existing
 * submission shape and validates them with the engine's OWN parseSubmission, so
 * the static engine, schema, renderer, and persistence do not change — the crew
 * just authors the same envelope, far better directed. Per-call timeouts live in
 * each stage.
 */
import { MAIN_STREET_SPEC, type MainStreetAuthored } from '@/lib/archetypes/main-street/builder';
import type { ArchetypeBuildSpec } from '@/lib/archetypes/builder';
import { logger } from '@/lib/logger';
import { withTimeout } from '@/lib/with-timeout';
import { direct, TIMEOUT_MS as DIRECTOR_TIMEOUT_MS } from './director';
import { writeCopy, TIMEOUT_MS as COPYWRITER_TIMEOUT_MS } from './copywriter';
import { rollTreatments } from './treatment-roll';
import { shootMoment, TIMEOUT_MS as CINEMATOGRAPHER_TIMEOUT_MS } from './cinematographer';
import { designLook, TIMEOUT_MS as GRAPHIC_ARTIST_TIMEOUT_MS } from './graphic-artist';
import { directorsCut, TIMEOUT_MS as DIRECTORS_CUT_TIMEOUT_MS } from './directors-cut';
import type { Trajectory } from './trajectory';
import type { CrewBrief, CrewOutput } from './types';

/**
 * Overall crew pipeline deadline. The crew runs sequentially, so without an
 * overall ceiling a worst-case run can sit at the sum of per-stage timeouts
 * (which already caused a real failure when the sum exceeded the route's
 * 300s ceiling). This bites if the stages individually stay under their
 * timeouts but collectively run too long.
 *
 * Sized at 290s — under the route's 300s ceiling, leaving headroom for media
 * generation + the DB write that happen after this returns. A guard test
 * (pipeline.test.ts) asserts the sum of per-stage timeouts also stays under
 * the route ceiling, so this can't silently regress.
 */
export const PIPELINE_DEADLINE_MS = 290_000;

/** The route ceiling (start/route.ts `maxDuration = 300`), in ms. Exported so
 *  the guard test asserts the invariant in one place. */
export const ROUTE_CEILING_MS = 300_000;

/** Sum of the five stage timeouts. The pipeline runs them sequentially, so
 *  this is the worst-case wall time without the overall deadline. Must stay
 *  under ROUTE_CEILING_MS — asserted by the guard test. */
export const STAGE_TIMEOUTS_SUM_MS =
  DIRECTOR_TIMEOUT_MS +
  COPYWRITER_TIMEOUT_MS +
  CINEMATOGRAPHER_TIMEOUT_MS +
  GRAPHIC_ARTIST_TIMEOUT_MS +
  DIRECTORS_CUT_TIMEOUT_MS;

export interface CrewBuildResult {
  chosen: { spec: ArchetypeBuildSpec; lookKey: string };
  authored: MainStreetAuthored;
  /** The Director's trajectory — the one creative North Star the whole crew
   *  executed to. Surfaced for the orchestrator to log against the tenant after
   *  persistence so we can read what Bohdi actually said when reviewing a build. */
  trajectory: Trajectory;
  /** The three look-driving picks, surfaced for the orchestrator to log against
   *  the real tenant + niche after persistence (the crew runs before the tenant
   *  exists, so it records nothing itself). */
  choices: {
    heroKind: CrewOutput['moment']['kind'];
    goodsTreatment: CrewOutput['copy']['goods']['treatment'];
    founderTreatment: CrewOutput['copy']['founder']['treatment'];
    /** What the dice dealt before the copywriter played — surfaced alongside the
     *  pick so logging can spot Bohdi overriding back to one body (reconvergence). */
    goodsRoll: CrewOutput['copy']['goods']['treatment'];
    founderRoll: CrewOutput['copy']['founder']['treatment'];
  };
}

/** Fold the crew's three artifacts into the engine's `{ content, products }`
 *  submission. The copywriter owns the words; the cinematographer's scene becomes
 *  the moment media; the graphic artist's prompts become the founder photo and
 *  each product's imagePrompt (matched by slug — coverage is guaranteed by the
 *  graphic-artist and director's-cut gates). */
function assembleSubmission(out: CrewOutput, shopName: string): { content: unknown; products: unknown } {
  const { copy, moment, look } = out;
  const imageBySlug = new Map(look.products.map((p) => [p.slug, p.imagePrompt]));
  // The shop name is the maker's one fixed onboarding fact — the crew never renames
  // it. Force it through as the shopName, the nav wordmark, and the brand the hero
  // lands on, discarding anything the copywriter proposed for those.
  const content = {
    shopName,
    identity: { ...copy.identity, wordmark: shopName },
    moment: {
      ...copy.moment,
      brand: shopName,
      media: { kind: moment.kind, prompt: moment.prompt, alt: moment.alt },
      // The Collage hero's stills, designed by the cinematographer. Carried through
      // so the pantry is full; generation resolves their urls later. Omitted when
      // the cinematographer didn't design them (Collage then degrades gracefully).
      ...(moment.collageShots ? { collageShots: moment.collageShots } : {}),
    },
    goods: copy.goods,
    founder: { ...copy.founder, photo: { prompt: look.founderPhoto.prompt, alt: look.founderPhoto.alt } },
    close: copy.close,
    about: copy.about,
    contact: copy.contact,
  };
  const products = copy.products.map((p) => ({
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription,
    description: p.description,
    basePriceCents: p.basePriceCents,
    imagePrompt: imageBySlug.get(p.slug) ?? '',
  }));
  return { content, products };
}

/** Run the crew and produce the engine's MainStreetAuthored envelope.
 *  Wrapped in PIPELINE_DEADLINE_MS so a slow collective run aborts cleanly
 *  under the route ceiling instead of being killed by Vercel. */
export async function directAndProduce(brief: CrewBrief, rand: () => number = Math.random): Promise<CrewBuildResult> {
  return withTimeout(runCrew(brief, rand), PIPELINE_DEADLINE_MS, 'crew pipeline');
}

async function runCrew(brief: CrewBrief, rand: () => number): Promise<CrewBuildResult> {
  const trajectory = await direct(brief);
  // Code rolls the dice; the copywriter reads them and plays or overrides (D48).
  const rolls = rollTreatments(rand);
  const copy = await writeCopy(brief, trajectory, rolls);
  const moment = await shootMoment(trajectory, copy.moment.story);
  const look = await designLook(brief, trajectory, copy.moment.story, moment, copy.products);
  // Director's Cut sees the full brief — it's the coherence pass, not a
  // creative decision about color, so it benefits from every signal we have.
  const cut = await directorsCut(brief, trajectory, { copy, moment, look });

  const parsed = MAIN_STREET_SPEC.parseSubmission(assembleSubmission(cut, brief.shopName));
  if (!parsed.ok) {
    throw new Error(`Crew output failed the engine schema: ${parsed.issues.map((i) => `${i.path}: ${i.message}`).join('; ')}`);
  }

  logger.info('crew: produced', { skin: cut.look.skinKey, products: cut.copy.products.length });
  return {
    chosen: { spec: MAIN_STREET_SPEC, lookKey: cut.look.skinKey },
    authored: parsed.authored,
    trajectory,
    choices: {
      heroKind: cut.moment.kind,
      goodsTreatment: cut.copy.goods.treatment,
      founderTreatment: cut.copy.founder.treatment,
      goodsRoll: rolls.goods,
      founderRoll: rolls.founder,
    },
  };
}
