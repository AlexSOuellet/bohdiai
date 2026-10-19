/**
 * The headline at the top of the home page and the line under it (every plan;
 * Alex, 2026-10-19). They live in `site_moments` with the rest of the moment, but
 * this form holds only these two, so a plan that may change the headline never
 * touches the photo, the buttons or the story.
 */
import { MOMENT_LIMITS } from './moment-form';

export type HeadlineForm = { headline: string; sub: string };

export type HeadlineRow = { headline: string; sub: string | null };

const oneLine = (s: string): string => s.trim().replace(/\s+/g, ' ');

export function buildHeadlineRow(form: HeadlineForm): { ok: true; row: HeadlineRow } | { ok: false; error: string } {
  const headline = oneLine(form.headline);
  const sub = oneLine(form.sub);
  if (headline === '') return { ok: false, error: 'Add your headline. It’s the big words at the top of your home page.' };
  if (headline.length > MOMENT_LIMITS.headline)
    return { ok: false, error: `The headline is ${headline.length} characters. Keep it to ${MOMENT_LIMITS.headline}.` };
  if (sub.length > MOMENT_LIMITS.sub)
    return { ok: false, error: `The line under the headline is ${sub.length} characters. Keep it to ${MOMENT_LIMITS.sub}.` };
  return { ok: true, row: { headline, sub: sub === '' ? null : sub } };
}
