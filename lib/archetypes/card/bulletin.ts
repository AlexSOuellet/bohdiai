/**
 * Business card, bulletin board design — the small decisions the flyer makes
 * from the owner's data (bulletin board spec): how the name breaks into stamped
 * lines and how big, where the tear-off tabs lead, and how a market date splits
 * into the circled day and the rest.
 */
import { dialable, type ProfileForm } from '@/lib/backend/profile/profile-form';
import type { MarketDate } from '@/lib/backend/dates/dates-form';
import { marketDay } from './data';
import { CARD_STRINGS as S } from './strings';

export const TOUCH_ID = 'touch';

export type NameSize = 'xl' | 'l' | 'm' | 's';

/** One word per stamped line; the size steps down so the longest word fits the flyer. */
export function nameLines(name: string): { lines: string[]; size: NameSize } {
  const lines = name.trim().split(/\s+/).filter((w) => w !== '');
  const longest = Math.max(0, ...lines.map((w) => w.length));
  const size: NameSize = longest <= 7 ? 'xl' : longest <= 10 ? 'l' : longest <= 14 ? 'm' : 's';
  return { lines, size };
}

export type TabTarget = { kind: 'call' | 'message'; href: string; label: string };

/** Like a real flyer: the tabs carry the phone number when there is one; otherwise they lead to the contact form. */
export function tabTarget(profile: ProfileForm): TabTarget {
  if (profile.phone !== '') return { kind: 'call', href: `tel:${dialable(profile.phone)}`, label: profile.phone };
  return { kind: 'message', href: `#${TOUCH_ID}`, label: S.bulletin.tab(profile.signature) };
}

export function datePieces(d: MarketDate): { day: string; market: string; town: string } {
  return { day: marketDay(d), market: d.name, town: d.town };
}

/** The torch's burned name: one word per line, but a word of two characters or
 *  fewer ("&", "of") joins the word after it, so "Ember & Pine" burns as
 *  "Ember" / "& Pine". */
export function torchLines(name: string): string[] {
  const words = name.trim().split(/\s+/).filter((w) => w !== '');
  const lines: string[] = [];
  let carry = '';
  for (const w of words) {
    if (w.length <= 2) {
      carry = carry === '' ? w : `${carry} ${w}`;
      continue;
    }
    lines.push(carry === '' ? w : `${carry} ${w}`);
    carry = '';
  }
  if (carry !== '') {
    if (lines.length === 0) lines.push(carry);
    else lines[lines.length - 1] = `${lines[lines.length - 1]} ${carry}`;
  }
  return lines;
}

/** The show reel's red panel slides a heading in as two halves from opposite
 *  sides: split at the word nearest the middle by length. */
export function halves(text: string): [string, string] {
  const words = text.trim().split(/\s+/).filter((w) => w !== '');
  if (words.length < 2) return [words.join(' '), ''];
  const total = words.join(' ').length;
  let best = 1;
  let bestGap = Infinity;
  for (let i = 1; i < words.length; i++) {
    const gap = Math.abs(words.slice(0, i).join(' ').length - total / 2);
    if (gap < bestGap) {
      bestGap = gap;
      best = i;
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

/** The torch's brand ring: "Name · Tag line · " when that fits once around,
 *  otherwise the name repeated until the ring is full. */
export function ringFill(name: string, kicker: string, fits = 46): string {
  const both = `${name} · ${kicker} · `;
  if (kicker !== '' && both.length <= fits) return both;
  const once = `${name} · `;
  return once.repeat(Math.max(1, Math.floor(fits / once.length)));
}
