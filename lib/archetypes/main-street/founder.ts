/**
 * Main Street — About-beat (founder) treatment selection.
 *
 * Beat 3 is the maker, in their own voice. It has four MAKER-ONLY bodies; the
 * market calendar is its own separate beat, never inside these.
 *
 *  - quote    — portrait beside a pull-quote. Calm, authority-forward (default).
 *  - portrait — a large CONTAINED portrait, quote over a soft scrim. Cinematic.
 *  - letter   — the quote as a short signed note, small inset portrait. Intimate.
 *  - card     — the "Meet June" card: eyebrow, heading, round face, a warm
 *               pull-quote, and the about cue. Personal.
 *
 * BOHDI picks the treatment (now dealt a roll he plays or overrides — see the
 * crew). Any treatment fits any mood, so there is NO mood→treatment rule here.
 * This selector is only the deterministic fallback for legacy rows authored
 * before the treatment field existed: the maker's pick wins, else the quote.
 */

export type FounderTreatment = 'quote' | 'portrait' | 'letter' | 'card';

/**
 * Resolve the About treatment. Bohdi's pick wins; with no pick (legacy content)
 * it falls back to the quote. No mood input — mood never chose a treatment.
 */
export function selectFounderTreatment(pick?: FounderTreatment | undefined): FounderTreatment {
  return pick ?? 'quote';
}
