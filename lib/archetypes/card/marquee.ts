/**
 * Business card marquee timing. The big-words row loops in MARQUEE_SECONDS; the
 * market dates row gets its own loop time, worked out from how wide each row's
 * half (one set) is, so both rows travel across the screen at the same speed
 * whatever the owner wrote. Widths are estimated from character counts in
 * big-word ems; close enough for matching pace, not for layout.
 */

/** One full loop of the big-words row. */
export const MARQUEE_SECONDS = 100;

/** Rough glyph width, in each row's own font size. */
const CHAR_EM = 0.62;
/** Big-words row: per item, the gap and the star after it (.6em + .6em + the star glyph). */
const LOUD_ITEM_EM = 1.7;
/** Dates row: letter spacing per character, the gap after each line, and its font
 *  size against the big words' (22px vs 64px on a wide screen). */
const DATES_SPACING_EM = 0.04;
const DATES_ITEM_EM = 2.4;
const DATES_SCALE = 22 / 64;

/** Width of one set of the big words, in big-word ems. */
function loudWidth(set: readonly string[]): number {
  return set.reduce((sum, w) => sum + w.length * CHAR_EM + LOUD_ITEM_EM, 0);
}

/** Width of one set of the dates row, in big-word ems. */
function datesWidth(set: readonly string[]): number {
  return set.reduce((sum, w) => sum + w.length * (CHAR_EM + DATES_SPACING_EM) + DATES_ITEM_EM, 0) * DATES_SCALE;
}

/** Seconds for the dates row to loop at the big words' speed. `loudSet` is one set
 *  of the big words; `datesSet` is half of the filled dates row. At least 10s. */
export function marqueeDatesSeconds(loudSet: readonly string[], datesSet: readonly string[]): number {
  const loud = loudWidth(loudSet);
  if (loud === 0) return MARQUEE_SECONDS;
  return Math.max(10, Math.round((MARQUEE_SECONDS * datesWidth(datesSet)) / loud));
}

/** The dates row's loop time, as the rule the page carries. */
export function marqueeDatesCss(seconds: number): string {
  return `.bc-marquee__row--dates{animation-duration:${seconds}s}`;
}
