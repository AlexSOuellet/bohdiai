/**
 * Testimonials (Full; Saltmarsh & Lace demo spec): what her customers say. The
 * owner writes or pastes each one: the words, who said it, and an optional detail
 * (a town, or what they bought). Limits match the site_testimonials table.
 */
export const TESTIMONIALS_LIMIT = 30;
export const QUOTE_MAX = 600;
export const NAME_MAX = 60;
export const DETAIL_MAX = 60;

export type Testimonial = { id: string; quote: string; name: string; detail: string };
export type TestimonialForm = { id: string | null; quote: string; name: string; detail: string };

export const EMPTY_TESTIMONIAL: TestimonialForm = { id: null, quote: '', name: '', detail: '' };

export type TestimonialRow = { quote: string; name: string; detail: string | null };

const tidy = (s: string): string => s.trim().replace(/\s+/g, ' ');

export function buildTestimonialRow(form: TestimonialForm): { ok: true; row: TestimonialRow } | { ok: false; error: string } {
  const quote = form.quote.trim().replace(/[ \t]+/g, ' ');
  const name = tidy(form.name);
  const detail = tidy(form.detail);
  if (quote === '') return { ok: false, error: 'Add what they said.' };
  if (quote.length > QUOTE_MAX) return { ok: false, error: `Keep it to ${QUOTE_MAX} characters or fewer.` };
  if (name === '') return { ok: false, error: 'Add who said it, like Maria or Maria P.' };
  if (name.length > NAME_MAX) return { ok: false, error: `Keep the name to ${NAME_MAX} characters or fewer.` };
  if (detail.length > DETAIL_MAX) return { ok: false, error: `Keep the detail to ${DETAIL_MAX} characters or fewer.` };
  return { ok: true, row: { quote, name, detail: detail === '' ? null : detail } };
}

export function testimonialFromRow(r: { id: string; quote: string; name: string; detail: string | null }): Testimonial {
  return { id: r.id, quote: r.quote, name: r.name, detail: r.detail ?? '' };
}

/** The ids in the new order, checked against what she has: every one, each once. */
export function checkOrder(ids: readonly string[], have: readonly string[]): boolean {
  return ids.length === have.length && new Set(ids).size === ids.length && ids.every((id) => have.includes(id));
}
