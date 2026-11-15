/**
 * The share-only "try the tools" page (Alex, 2026-11-15): people try the tools,
 * tick the tool ideas they'd use, and say what they think. Not permanent; it comes
 * down when Alex has his feedback. Responses live in `tool_feedback`.
 */

/** The tools being considered (agreed so far, Plan-Backends.md and Session 118). */
export const IDEAS = [
  { key: 'tags', name: 'Price tags and labels', about: 'Print price tags and product labels for your pieces, ready to cut out.' },
  { key: 'shopping', name: 'Supply shopping list', about: 'Turn what you plan to make into a list of the supplies to buy.' },
  { key: 'batch', name: 'Batch planner', about: 'Plan a batch: how many to make, what it needs and how long it will take.' },
  { key: 'cards', name: 'Care cards and thank-you cards', about: 'Print care instructions and thank-you notes to tuck in with each order.' },
  { key: 'backgrounds', name: 'Photo backgrounds', about: 'Give your product photos a clean background so your work stands out.' },
] as const;

export type IdeaKey = (typeof IDEAS)[number]['key'];
export type FeedbackRow = { message: string; wants: IdeaKey[]; name: string; email: string; makes: string };

const MESSAGE_MAX = 2000;
const NAME_MAX = 80;
const EMAIL_MAX = 200;
const MAKES_MAX = 120;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isIdea = (v: unknown): v is IdeaKey => IDEAS.some((i) => i.key === v);
const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** A response as the page sent it, checked. A filled hidden `company` field is a bot. */
export function parseFeedback(body: unknown): { kind: 'ok'; row: FeedbackRow } | { kind: 'invalid'; error: string } | { kind: 'spam' } {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) return { kind: 'invalid', error: 'That didn’t come through. Please try again.' };
  const b = body as Record<string, unknown>;
  if (text(b['company']) !== '') return { kind: 'spam' };
  const message = text(b['message']);
  const wants = [...new Set((Array.isArray(b['wants']) ? b['wants'] : []).filter(isIdea))];
  const name = text(b['name']);
  const email = text(b['email']);
  const makes = text(b['makes']);
  if (message === '' && wants.length === 0) return { kind: 'invalid', error: 'Tell us what you think, or tick a tool you’d use.' };
  if (message.length > MESSAGE_MAX) return { kind: 'invalid', error: 'Please keep it under 2,000 characters.' };
  if (email !== '' && (email.length > EMAIL_MAX || !EMAIL.test(email))) return { kind: 'invalid', error: 'That email doesn’t look right. Leave it blank if you’d rather.' };
  if (name.length > NAME_MAX) return { kind: 'invalid', error: 'That name is too long.' };
  if (makes.length > MAKES_MAX) return { kind: 'invalid', error: 'Keep what you make to a few words.' };
  return { kind: 'ok', row: { message, wants, name, email, makes } };
}

/** How many people want each idea, most wanted first; ideas no one ticked still show. */
export function tally(rows: ReadonlyArray<{ wants: readonly string[] }>): Array<{ key: IdeaKey; name: string; count: number }> {
  return IDEAS.map((i) => ({ key: i.key, name: i.name, count: rows.filter((r) => r.wants.includes(i.key)).length })).sort((a, b) => b.count - a.count);
}
