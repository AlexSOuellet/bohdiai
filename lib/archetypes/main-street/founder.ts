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
 * BOHDI picks the treatment (like the goods beat). When he doesn't, we lean on
 * mood only — NEVER on market-date count, which we don't know at onboarding.
 */

export type FounderTreatment = 'quote' | 'portrait' | 'letter' | 'card';

/** Intimate, homemade moods read as the personal card. */
const INTIMATE_MOODS = ['cozy', 'rustic', 'homey'];
/** Cinematic, image-led moods read as a portrait. */
const CINEMATIC_MOODS = ['dark', 'sunset', 'botanical'];

function matches(mood: string | undefined, set: string[]): boolean {
  if (!mood) return false;
  const m = mood.toLowerCase();
  return set.some((x) => m.includes(x));
}

/**
 * Pick the About treatment. Bohdi's explicit pick wins; otherwise mood chooses
 * how intimate or cinematic the band reads. No market-date input.
 */
export function selectFounderTreatment(opts: { mood?: string | undefined; pick?: FounderTreatment | undefined }): FounderTreatment {
  if (opts.pick) return opts.pick;
  if (matches(opts.mood, INTIMATE_MOODS)) return 'card';
  if (matches(opts.mood, CINEMATIC_MOODS)) return 'portrait';
  return 'quote';
}
