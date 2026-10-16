/**
 * The intake form (bohdiai.com/start), checked. Pure: it reads the posted form
 * and either names what's wrong (as a spot in the form's words, never a word of
 * its own) or hands back exactly what to save. Shared by the page (instant
 * messages) and the route (which checks again before saving).
 */
import type { MoodKey } from '@/lib/moods';

export const MIN_PIECES = 5;
export const MAX_PIECES = 10;
export const PHOTO_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];
/** The most the Images binding reads. The page shrinks photos well under this first. */
export const MAX_PHOTO_BYTES = 20 * 1024 * 1024;

export const INTAKE_LIMITS = { name: 120, business: 120, email: 254, makes: 600, about: 5000, pieceName: 120, pieceAbout: 2000, price: 20 } as const;

/** The feelings a maker can pick, in the order the form shows them. */
export const INTAKE_MOODS = ['cozy', 'rustic', 'dark', 'elegant', 'cheerful', 'modern'] as const satisfies readonly MoodKey[];
export type IntakeMood = (typeof INTAKE_MOODS)[number];

/** Field names the page posts and the route reads. Pieces repeat, in order. */
export const FIELD = {
  name: 'makerName',
  business: 'businessName',
  email: 'email',
  makes: 'makes',
  about: 'about',
  mood: 'mood',
  portrait: 'portrait',
  pieceName: 'pieceName',
  piecePrice: 'piecePrice',
  pieceAbout: 'pieceAbout',
  piecePhoto: 'piecePhoto',
  honeypot: 'company',
} as const;

/** The mood field's value for "you pick for me". */
export const MOOD_PICK = 'pick';

/** Every problem the form can name; each is a spot in the form's words (errors.*). */
export const ERROR_SPOTS = [
  'name',
  'business',
  'email',
  'makes',
  'about',
  'piecesFew',
  'piecesMany',
  'pieceName',
  'piecePrice',
  'piecePhoto',
  'photoType',
  'photoBig',
  'photoUnread',
  'tooLong',
  'mood',
] as const;
export type ErrorSpot = (typeof ERROR_SPOTS)[number];

export function isErrorSpot(v: unknown): v is ErrorSpot {
  return typeof v === 'string' && (ERROR_SPOTS as readonly string[]).includes(v);
}

/** What's wrong: the spot whose words say so, and the values for its blanks. */
export type IntakeProblem = { spot: ErrorSpot; values: Record<string, string | number> };

export type IntakeFields = {
  makerName: string;
  businessName: string;
  email: string;
  makes: string;
  about: string;
  /** Null is "you pick for me". */
  mood: IntakeMood | null;
};

export type IntakePiece = { name: string; priceCents: number | null; description: string | null; photo: File };

export type IntakeParsed =
  | { kind: 'spam' }
  | { kind: 'invalid'; problem: IntakeProblem }
  | { kind: 'ok'; fields: IntakeFields; pieces: IntakePiece[]; portrait: File | null };

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A price as typed ("25", "$25", "1,200.50") in cents; blank is "ask me" (null);
 *  anything else is undefined (not a price). */
export function priceToCents(typed: string): number | null | undefined {
  const t = typed.trim().replace(/^\$\s*/, '').replace(/,/g, '');
  if (t === '') return null;
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return undefined;
  const [whole, part = ''] = t.split('.');
  const cents = Number(whole) * 100 + Number(part.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents <= 2_147_483_647 ? cents : undefined;
}

/** A photo's problem, or null when it can be saved. */
export function photoProblem(file: File): ErrorSpot | null {
  if (!PHOTO_TYPES.includes(file.type)) return 'photoType';
  if (file.size > MAX_PHOTO_BYTES) return 'photoBig';
  return null;
}

/** The form's own fields, before the pieces, so the page can check as it goes. */
export type IntakeDraft = IntakeFields & {
  pieces: { name: string; price: string; description: string; photo: File | null }[];
  portrait: File | null;
  /** True once a mood (or "you pick") is chosen. */
  moodChosen: boolean;
};

/** The first thing wrong with a draft, top of the form first; null when it's ready. */
export function checkIntake(d: IntakeDraft): IntakeProblem | null {
  const p = (spot: ErrorSpot, values: Record<string, string | number> = {}): IntakeProblem => ({ spot, values });
  if (d.makerName.trim() === '') return p('name');
  if (d.businessName.trim() === '') return p('business');
  if (!EMAIL_SHAPE.test(d.email.trim())) return p('email');
  if (d.makes.trim() === '') return p('makes');
  if (d.pieces.length < MIN_PIECES) return p('piecesFew', { min: MIN_PIECES });
  if (d.pieces.length > MAX_PIECES) return p('piecesMany', { max: MAX_PIECES });
  for (const [i, piece] of d.pieces.entries()) {
    const n = i + 1;
    if (piece.photo === null) return p('piecePhoto', { n });
    const bad = photoProblem(piece.photo);
    if (bad !== null) return p(bad, { n });
    if (piece.name.trim() === '') return p('pieceName', { n });
    if (priceToCents(piece.price) === undefined) return p('piecePrice', { n });
    if (piece.name.trim().length > INTAKE_LIMITS.pieceName || piece.description.trim().length > INTAKE_LIMITS.pieceAbout) return p('tooLong');
  }
  if (d.about.trim() === '') return p('about');
  if (d.portrait !== null) {
    const bad = photoProblem(d.portrait);
    if (bad !== null) return p(bad, { n: 0 });
  }
  if (!d.moodChosen) return p('mood');
  const long =
    d.makerName.trim().length > INTAKE_LIMITS.name ||
    d.businessName.trim().length > INTAKE_LIMITS.business ||
    d.email.trim().length > INTAKE_LIMITS.email ||
    d.makes.trim().length > INTAKE_LIMITS.makes ||
    d.about.trim().length > INTAKE_LIMITS.about;
  return long ? p('tooLong') : null;
}

function text(form: FormData, name: string): string {
  const v = form.get(name);
  return typeof v === 'string' ? v : '';
}

function file(v: FormDataEntryValue | null | undefined): File | null {
  return v instanceof File && v.size > 0 ? v : null;
}

function isMood(v: string): v is IntakeMood {
  return (INTAKE_MOODS as readonly string[]).includes(v);
}

/** The posted form, checked whole. A filled honeypot is spam: answered as sent, saved nowhere. */
export function parseIntake(form: FormData): IntakeParsed {
  if (text(form, FIELD.honeypot).trim() !== '') return { kind: 'spam' };
  const moodValue = text(form, FIELD.mood);
  const names = form.getAll(FIELD.pieceName);
  const prices = form.getAll(FIELD.piecePrice);
  const abouts = form.getAll(FIELD.pieceAbout);
  const photos = form.getAll(FIELD.piecePhoto);
  const str = (v: FormDataEntryValue | undefined): string => (typeof v === 'string' ? v : '');
  const draft: IntakeDraft = {
    makerName: text(form, FIELD.name),
    businessName: text(form, FIELD.business),
    email: text(form, FIELD.email),
    makes: text(form, FIELD.makes),
    about: text(form, FIELD.about),
    mood: isMood(moodValue) ? moodValue : null,
    moodChosen: isMood(moodValue) || moodValue === MOOD_PICK,
    portrait: file(form.get(FIELD.portrait)),
    pieces: names.map((name, i) => ({ name: str(name), price: str(prices[i]), description: str(abouts[i]), photo: file(photos[i]) })),
  };
  const problem = checkIntake(draft);
  if (problem !== null) return { kind: 'invalid', problem };
  return {
    kind: 'ok',
    fields: {
      makerName: draft.makerName.trim(),
      businessName: draft.businessName.trim(),
      email: draft.email.trim(),
      makes: draft.makes.trim(),
      about: draft.about.trim(),
      mood: draft.mood,
    },
    portrait: draft.portrait,
    // checkIntake proved every piece has its photo and every price reads.
    pieces: draft.pieces.flatMap((p) =>
      p.photo === null
        ? []
        : [{ name: p.name.trim(), priceCents: priceToCents(p.price) ?? null, description: p.description.trim() === '' ? null : p.description.trim(), photo: p.photo }],
    ),
  };
}
