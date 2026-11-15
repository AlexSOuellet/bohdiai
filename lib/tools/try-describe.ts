/**
 * Describe it on the share-only try-the-tools page (Alex, 2026-11-15): anyone can
 * run it, guarded by the five-a-minute spam guard. A visitor has no storage, so the
 * photo comes with the request, already shrunk on their device, goes to the model
 * and is never kept.
 */
import { parseDollars } from '@/lib/backend/catalog/product-form';
import { FACTS_MAX } from './describe-limits';
import type { DescribeInput } from './describe';

const NAME_MAX = 120;
const MATERIALS_MAX = 30;
/** The base64 photo's most characters (about 3 MB of picture; the browser shrinks it well under). */
export const PHOTO_MAX = 4_000_000;
const PHOTO = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+=*)$/;

const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

export function parseTryDescribe(body: unknown): { kind: 'ok'; input: DescribeInput } | { kind: 'invalid'; error: string } {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) return { kind: 'invalid', error: 'That didn’t come through. Please try again.' };
  const b = body as Record<string, unknown>;
  const name = text(b['name']);
  if (name === '') return { kind: 'invalid', error: 'Give the piece a name first.' };
  if (name.length > NAME_MAX) return { kind: 'invalid', error: 'Keep the name shorter.' };
  const facts = text(b['facts']);
  if (facts.length > FACTS_MAX) return { kind: 'invalid', error: `Keep what you add to ${FACTS_MAX} characters or fewer.` };
  const materials = text(b['madeOf'])
    .split('\n')
    .map((m) => m.trim())
    .filter((m) => m !== '')
    .slice(0, MATERIALS_MAX);
  const price = parseDollars(text(b['price']));
  let photoData: DescribeInput['photoData'] = null;
  const raw = text(b['photo']);
  if (raw !== '') {
    if (raw.length > PHOTO_MAX) return { kind: 'invalid', error: 'That photo is too big. Try a smaller one.' };
    const m = PHOTO.exec(raw);
    if (m === null) return { kind: 'invalid', error: 'That photo couldn’t be read. Try a JPG or PNG.' };
    photoData = { mediaType: m[1] as 'image/jpeg' | 'image/png' | 'image/webp', data: m[2] ?? '' };
  }
  return { kind: 'ok', input: { name, materials, facts, priceCents: price.ok ? price.cents : null, photoUrl: null, photoData } };
}
