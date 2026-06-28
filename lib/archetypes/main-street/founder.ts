/**
 * Main Street — About-beat (founder) treatment selection.
 *
 * Beat 3 is the maker, in their own voice. It has seven MAKER-ONLY bodies; the
 * market calendar is its own separate beat, never inside these.
 *
 *  - quote     — portrait beside a pull-quote. Calm, authority-forward (default).
 *  - portrait  — a large CONTAINED portrait, quote over a soft scrim. Cinematic.
 *  - letter    — a note on a slip of paper, a clipped snapshot, a signed hand. Intimate.
 *  - card      — the "Meet June" card: eyebrow, heading, round face, a warm
 *                pull-quote, and the about cue. Personal.
 *  - workbench — a wide documentary shot of the maker at work + a caption. The craft.
 *  - editorial — a magazine feature: drop-cap prose (the long About story), a
 *                pull-quote, a byline. Long-form and refined.
 *  - signature — the maker's promise set large as type, no photo. A manifesto.
 *
 * BOHDI picks the treatment (now dealt a roll he plays or overrides — see the
 * crew). Any treatment fits any mood, so there is NO mood→treatment rule here.
 * This selector is only the deterministic fallback for legacy rows authored
 * before the treatment field existed: the maker's pick wins, else the quote.
 */

import type { FOUNDER_TREATMENTS } from './schemas';

export type FounderTreatment = (typeof FOUNDER_TREATMENTS)[number];

/**
 * Resolve the About treatment. Bohdi's pick wins; with no pick (legacy content)
 * it falls back to the quote. No mood input — mood never chose a treatment.
 */
export function selectFounderTreatment(pick?: FounderTreatment | undefined): FounderTreatment {
  return pick ?? 'quote';
}
