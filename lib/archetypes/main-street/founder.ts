/**
 * Main Street — founder-beat treatment selection.
 *
 * Beat 3 is the authority of the shop: the maker, in their own voice, beside
 * where to meet them. Like the goods beat it has several bodies, system-selected
 * so the founder band stops defaulting to one dark slab. It is a TEASER — a taste
 * of the maker — with an "about" cue to the full bio on the About page.
 *
 *  - quote    — portrait beside a pull-quote. Calm, authority-forward (default).
 *  - portrait — a large CONTAINED portrait in the band, quote over a soft scrim.
 *               Cinematic; the image stays inside the column, never edge to edge.
 *  - letter   — the quote as a short signed note, small inset portrait. Intimate;
 *               the one that fights the dark-band reflex hardest.
 *  - findus   — the "find us this week" calendar as the hero, portrait + a line of
 *               voice supporting it. For makers whose in-person presence IS the
 *               story; only valid WITH a calendar.
 *
 * The calendar is an independent axis: shown whenever the maker actually does
 * in-person events (a find-us list exists), regardless of treatment.
 */

export type FounderTreatment = 'quote' | 'portrait' | 'letter' | 'findus';

/** Many find-us dates → the maker is a market regular; lead with the calendar. */
const FINDUS_FORWARD_ROWS = 3;

/** Intimate, homemade moods read as a personal letter. */
const LETTER_MOODS = ['cozy', 'rustic', 'homey'];
/** Cinematic, image-led moods read as a portrait. */
const PORTRAIT_MOODS = ['dark', 'sunset', 'botanical'];

function matches(mood: string | undefined, set: string[]): boolean {
  if (!mood) return false;
  const m = mood.toLowerCase();
  return set.some((x) => m.includes(x));
}

/**
 * Pick the founder treatment. Deterministic from the in-person cadence (how many
 * find-us rows) and mood. A maker out at markets often leads with the calendar;
 * otherwise mood chooses how intimate or cinematic the band reads.
 */
export function selectFounderTreatment(opts: { mood?: string | undefined; findUsRows: number }): FounderTreatment {
  if (opts.findUsRows >= FINDUS_FORWARD_ROWS) return 'findus';
  if (matches(opts.mood, LETTER_MOODS)) return 'letter';
  if (matches(opts.mood, PORTRAIT_MOODS)) return 'portrait';
  return 'quote';
}
