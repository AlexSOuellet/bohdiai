/**
 * Length-aware resubmit feedback for the crew's validation-retry loops.
 *
 * Without this, a too-long (or too-short) string field hands the model only zod's
 * stock ceiling ("String must contain at most 120 character(s)") — never the
 * field's ACTUAL length or how much to cut — so a verbose model keeps landing
 * just over the cap and burns its whole attempt budget. This reports the real
 * length and the exact characters to add/cut so the retry converges. Shared by
 * the Copywriter and the Cinematographer (both forced-tool loops); any future
 * specialist with a length cap should use it too.
 */
import type { z } from 'zod';

/** Read the value at a zod issue path (e.g. ['products', 9, 'description'] or
 *  ['alt']) out of the submitted input, so we can report a field's real length. */
export function valueAtPath(root: unknown, path: ReadonlyArray<string | number>): unknown {
  let cur: unknown = root;
  for (const key of path) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string | number, unknown>)[key];
  }
  return cur;
}

/** Turn zod issues into resubmit feedback. String length-cap violations get the
 *  field's REAL length and how many characters to add/cut; everything else passes
 *  through unchanged. */
export function lengthAwareIssues(error: z.ZodError, input: unknown): Array<{ path: string; message: string }> {
  return error.issues.map((i) => {
    const path = i.path.join('.');
    if ((i.code === 'too_big' || i.code === 'too_small') && i.type === 'string') {
      const val = valueAtPath(input, i.path);
      if (typeof val === 'string') {
        if (i.code === 'too_big') {
          const max = Number(i.maximum);
          return { path, message: `is ${val.length} characters but must be at most ${max} — cut at least ${val.length - max} characters and resubmit.` };
        }
        const min = Number(i.minimum);
        return { path, message: `is ${val.length} characters but must be at least ${min} — add at least ${min - val.length} characters and resubmit.` };
      }
    }
    return { path, message: i.message };
  });
}
