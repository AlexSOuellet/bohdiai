/**
 * Log the crew's creative choices to the `design_choices` table so patterns
 * become visible instead of guessed — e.g. why one build chose a video Moment
 * and another a still, or why two builds converged on the same goods treatment.
 *
 * Logged AFTER the store is persisted, from the build orchestrator, so every row
 * carries the REAL tenant id and niche slug (the crew itself runs before the
 * tenant exists and doesn't carry the slug — logging from there would force
 * nulls). The ids are required here, so a null can't slip back in without a type
 * error.
 *
 * Fire-and-forget by contract: a logging failure must NEVER fail a build. Every
 * write is wrapped so a rejected promise is swallowed (logged at warn, then
 * dropped). Callers should NOT await this for control flow.
 */
import { supabaseAdmin } from '@/lib/supabase';
import type { Json } from '@/lib/database.types';
import { logger } from '@/lib/logger';
import { GOODS_TREATMENTS } from '@/lib/archetypes/main-street/goods';
import { FOUNDER_TREATMENTS } from '@/lib/archetypes/main-street/schemas';

/** The two kinds of Moment the cinematographer chooses between. */
const MOMENT_KINDS = ['video', 'image'] as const;

export type DesignDecisionType = 'moment-kind' | 'goods-treatment' | 'founder-treatment';

export interface DesignChoice {
  /** The now-created tenant the build belongs to. */
  tenantId: string;
  /** The niche the maker picked — keys the pattern analysis with `moodKey`. */
  nicheSlug: string;
  moodKey: string;
  decisionType: DesignDecisionType;
  /** The full set of options the choice was made from. */
  candidates: Json;
  /** The option the crew landed on. */
  picked: Json;
  /** A short factual note on why/where the pick was recorded. */
  reasoning: string;
}

/**
 * Insert one design-choice row. Resolves once the write settles; rejections are
 * swallowed so this can be called fire-and-forget. Returns a promise the caller
 * may optionally await in tests, but build code must not block on it.
 */
export async function logDesignChoice(choice: DesignChoice): Promise<void> {
  const row = {
    tenant_id: choice.tenantId,
    decision_type: choice.decisionType,
    candidates: choice.candidates,
    picked: choice.picked,
    reasoning: choice.reasoning,
    niche_slug: choice.nicheSlug,
    mood_key: choice.moodKey,
  };

  const db = supabaseAdmin();

  try {
    const { error } = await db.from('design_choices').insert(row);
    if (error)
      logger.warn('crew: logDesignChoice insert failed', {
        decisionType: choice.decisionType,
        error: error.message,
      });
  } catch (err) {
    logger.warn('crew: logDesignChoice threw', {
      decisionType: choice.decisionType,
      err: String(err),
    });
  }
}

export interface CrewChoicesLog {
  tenantId: string;
  nicheSlug: string;
  moodKey: string;
  momentKind: (typeof MOMENT_KINDS)[number];
  goodsTreatment: string;
  founderTreatment: string;
  /** What the dice dealt before the copywriter played — logged beside the pick so
   *  overriding back to one body (reconvergence) is visible in the data (D48). */
  goodsRoll: string;
  founderRoll: string;
}

/** What got logged for a rolled treatment: the played treatment, the dealt roll,
 *  and whether Bohdi overrode the dice. */
function treatmentPick(
  treatment: string,
  rolled: string,
): { treatment: string; rolled: string; overrode: boolean } {
  return { treatment, rolled, overrode: treatment !== rolled };
}

/**
 * Record the crew's three look-driving choices — the Moment kind and the two
 * section treatments — against the now-created tenant. Fire-and-forget: each
 * write is unawaited and self-swallows failures, so a logging problem never
 * touches the build. Call once from the orchestrator after persistence.
 */
export function logCrewChoices(c: CrewChoicesLog): void {
  const base = { tenantId: c.tenantId, nicheSlug: c.nicheSlug, moodKey: c.moodKey };
  void logDesignChoice({
    ...base,
    decisionType: 'moment-kind',
    candidates: [...MOMENT_KINDS],
    picked: { kind: c.momentKind },
    reasoning: 'cinematographer chose the Moment kind for this build',
  });
  void logDesignChoice({
    ...base,
    decisionType: 'goods-treatment',
    candidates: [...GOODS_TREATMENTS],
    picked: treatmentPick(c.goodsTreatment, c.goodsRoll),
    reasoning: 'copywriter played or overrode the dealt goods treatment',
  });
  void logDesignChoice({
    ...base,
    decisionType: 'founder-treatment',
    candidates: [...FOUNDER_TREATMENTS],
    picked: treatmentPick(c.founderTreatment, c.founderRoll),
    reasoning: 'copywriter played or overrode the dealt founder treatment',
  });
}
