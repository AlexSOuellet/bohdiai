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
import type { Trajectory } from './trajectory';

/** The two kinds of hero the cinematographer produces. */
const MOMENT_KINDS = ['video', 'still'] as const;

export type DesignDecisionType = 'trajectory' | 'moment-kind';

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
  /** The Director's full trajectory — the creative North Star the whole crew
   *  executed to. Logged so we can read Bohdi's call when reviewing a build and
   *  tell a wrong-vision miss apart from a wrong-execution miss. */
  trajectory: Trajectory;
  heroKind: (typeof MOMENT_KINDS)[number];
}

/**
 * Record the crew's still-live look-driving choices — trajectory + Moment kind
 *  — against the now-created tenant. Section treatments (goods, founder,
 *  reviews, collections, findUs, nav) are the FAMILY's call now (§1.5) and are
 *  not logged per-build; the family is derivable from the tenant's mood_key.
 *  Fire-and-forget: each write is unawaited and self-swallows failures.
 */
export function logCrewChoices(c: CrewChoicesLog): void {
  const base = { tenantId: c.tenantId, nicheSlug: c.nicheSlug, moodKey: c.moodKey };
  void logDesignChoice({
    ...base,
    decisionType: 'trajectory',
    // The trajectory is freeform authoring, not a pick from a finite set, so
    // there is no candidates list to log here — the maker's niche + mood already
    // sit on the row as the inputs Bohdi authored from.
    candidates: [],
    picked: c.trajectory as unknown as Json,
    reasoning: 'director set the trajectory the whole crew executed to',
  });
  void logDesignChoice({
    ...base,
    decisionType: 'moment-kind',
    candidates: [...MOMENT_KINDS],
    picked: { kind: c.heroKind },
    reasoning: 'director chose the hero kind from the trajectory; cinematographer executed',
  });
}
