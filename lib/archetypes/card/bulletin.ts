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
