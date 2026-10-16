import { describe, it, expect } from 'vitest';
import { FAMILY_KEYS } from '@/lib/archetypes/main-street/families';
import { checkIntake, FIELD, isErrorSpot, MAX_PIECES, MIN_PIECES, MOOD_PICK, parseIntake, photoProblem, priceToCents, type IntakeDraft } from './request';

const CHOICES = { families: FAMILY_KEYS, plans: ['showcase', 'lite', 'full'] as const };
const photo = (name = 'a.jpg', type = 'image/jpeg', size = 10): File => new File([new Uint8Array(size)], name, { type });

function draft(over: Partial<IntakeDraft> = {}): IntakeDraft {
  return {
    plan: 'lite',
    billing: 'monthly',
    makerName: 'Lena',
    businessName: 'Saltmarsh & Lace',
    email: 'lena@example.com',
    password: 'tide pools 22',
    makes: 'Lace and sea glass',
    about: 'I started on the porch.',
    family: 'cozy',
    familyChosen: true,
    portrait: null,
    pieces: Array.from({ length: MIN_PIECES }, (_, i) => ({ name: `Piece ${i + 1}`, price: '25', description: '', photo: photo() })),
    ...over,
  };
}

function form(d: IntakeDraft, extra: Record<string, string> = {}): FormData {
  const f = new FormData();
  f.set(FIELD.plan, d.plan ?? '');
  f.set(FIELD.billing, d.billing);
  f.set(FIELD.name, d.makerName);
  f.set(FIELD.business, d.businessName);
  f.set(FIELD.email, d.email);
  f.set(FIELD.password, d.password);
  f.set(FIELD.makes, d.makes);
  f.set(FIELD.about, d.about);
  f.set(FIELD.family, d.family ?? (d.familyChosen ? MOOD_PICK : ''));
  if (d.portrait !== null) f.set(FIELD.portrait, d.portrait);
  for (const p of d.pieces) {
    f.append(FIELD.pieceName, p.name);
    f.append(FIELD.piecePrice, p.price);
    f.append(FIELD.pieceAbout, p.description);
    if (p.photo !== null) f.append(FIELD.piecePhoto, p.photo);
  }
  for (const [k, v] of Object.entries(extra)) f.set(k, v);
  return f;
}

describe('priceToCents', () => {
  it('reads prices the way people type them', () => {
    expect(priceToCents('25')).toBe(2500);
    expect(priceToCents('$25')).toBe(2500);
    expect(priceToCents(' $ 25.5 ')).toBe(2550);
    expect(priceToCents('1,200.05')).toBe(120005);
    expect(priceToCents('0')).toBe(0);
  });
  it('blank is "ask me"', () => {
    expect(priceToCents('  ')).toBeNull();
  });
  it('anything else is not a price', () => {
    expect(priceToCents('about 20')).toBeUndefined();
    expect(priceToCents('25.555')).toBeUndefined();
    expect(priceToCents('-5')).toBeUndefined();
    expect(priceToCents('99999999999')).toBeUndefined();
  });
});

describe('photoProblem', () => {
  it('takes JPG, PNG and WebP under 20MB', () => {
    expect(photoProblem(photo('a.png', 'image/png'))).toBeNull();
    expect(photoProblem(photo('a.heic', 'image/heic'))).toBe('photoType');
    expect(photoProblem(photo('a.jpg', 'image/jpeg', 21 * 1024 * 1024))).toBe('photoBig');
  });
});

describe('checkIntake', () => {
  it('a complete form is ready', () => {
    expect(checkIntake(draft())).toBeNull();
  });

  it('needs a password of 8 to 72 characters, taken as typed', () => {
    expect(checkIntake(draft({ password: 'short' }))).toEqual({ spot: 'password', values: { min: 8, max: 72 } });
    expect(checkIntake(draft({ password: 'x'.repeat(73) }))?.spot).toBe('password');
    expect(checkIntake(draft({ password: '        ' }))).toBeNull();
  });

  it('needs a plan first', () => {
    expect(checkIntake(draft({ plan: null, makerName: '' }))?.spot).toBe('plan');
  });

  it('names the first thing wrong, top of the form first', () => {
    expect(checkIntake(draft({ makerName: ' ', email: 'x' }))?.spot).toBe('name');
    expect(checkIntake(draft({ businessName: '' }))?.spot).toBe('business');
    expect(checkIntake(draft({ email: 'not an email' }))?.spot).toBe('email');
    expect(checkIntake(draft({ makes: '' }))?.spot).toBe('makes');
    expect(checkIntake(draft({ about: '' }))?.spot).toBe('about');
    expect(checkIntake(draft({ familyChosen: false, family: null }))?.spot).toBe('mood');
  });

  it('needs 5 to 10 pieces', () => {
    const few = draft({ pieces: draft().pieces.slice(0, MIN_PIECES - 1) });
    expect(checkIntake(few)).toEqual({ spot: 'piecesFew', values: { min: MIN_PIECES } });
    const many = draft({ pieces: Array.from({ length: MAX_PIECES + 1 }, () => draft().pieces[0]!) });
    expect(checkIntake(many)).toEqual({ spot: 'piecesMany', values: { max: MAX_PIECES } });
    const ten = draft({ pieces: Array.from({ length: MAX_PIECES }, () => draft().pieces[0]!) });
    expect(checkIntake(ten)).toBeNull();
  });

  it('names which piece is wrong', () => {
    const at = (i: number, change: Partial<IntakeDraft['pieces'][number]>): IntakeDraft =>
      draft({ pieces: draft().pieces.map((p, j) => (j === i ? { ...p, ...change } : p)) });
    expect(checkIntake(at(2, { photo: null }))).toEqual({ spot: 'piecePhoto', values: { n: 3 } });
    expect(checkIntake(at(0, { photo: photo('a.gif', 'image/gif') }))).toEqual({ spot: 'photoType', values: { n: 1 } });
    expect(checkIntake(at(1, { name: ' ' }))).toEqual({ spot: 'pieceName', values: { n: 2 } });
    expect(checkIntake(at(4, { price: 'twenty' }))).toEqual({ spot: 'piecePrice', values: { n: 5 } });
    expect(checkIntake(at(3, { price: '' }))).toBeNull();
    expect(checkIntake(at(0, { description: 'x'.repeat(2001) }))?.spot).toBe('tooLong');
  });

  it('checks their own photo when they send one', () => {
    expect(checkIntake(draft({ portrait: photo() }))).toBeNull();
    expect(checkIntake(draft({ portrait: photo('a.jpg', 'image/jpeg', 21 * 1024 * 1024) }))?.spot).toBe('photoBig');
  });

  it('"you pick for me" is a choice', () => {
    expect(checkIntake(draft({ family: null, familyChosen: true }))).toBeNull();
  });

  it('refuses words over the limits', () => {
    expect(checkIntake(draft({ about: 'x'.repeat(5001) }))?.spot).toBe('tooLong');
    expect(checkIntake(draft({ makerName: 'x'.repeat(121) }))?.spot).toBe('tooLong');
  });
});

describe('parseIntake', () => {
  it('a filled honeypot is spam', () => {
    expect(parseIntake(form(draft(), { [FIELD.honeypot]: 'Acme' }), CHOICES)).toEqual({ kind: 'spam' });
  });

  it('hands back exactly what to save, trimmed', () => {
    const d = draft({ makerName: ' Lena ', portrait: photo('me.jpg') });
    d.pieces[0] = { name: ' Tide pool ', price: '$40', description: ' Blue glass ', photo: photo('p.jpg') };
    d.pieces[1] = { ...d.pieces[1]!, price: '' };
    const out = parseIntake(form(d), CHOICES);
    expect(out.kind).toBe('ok');
    if (out.kind !== 'ok') return;
    expect(out.fields).toEqual({ plan: 'lite', billing: 'monthly', makerName: 'Lena', businessName: 'Saltmarsh & Lace', email: 'lena@example.com', makes: 'Lace and sea glass', about: 'I started on the porch.', family: 'cozy' });
    expect(out.portrait?.name).toBe('me.jpg');
    expect(out.password).toBe('tide pools 22');
    expect(out.pieces).toHaveLength(MIN_PIECES);
    expect(out.pieces[0]).toMatchObject({ name: 'Tide pool', priceCents: 4000, description: 'Blue glass' });
    expect(out.pieces[1]).toMatchObject({ priceCents: null, description: null });
  });

  it('"you pick for me" saves no mood', () => {
    const out = parseIntake(form(draft({ family: null, familyChosen: true })), CHOICES);
    expect(out.kind === 'ok' && out.fields.family).toBeNull();
  });

  it('takes any family there is, by its own name', () => {
    for (const key of FAMILY_KEYS) {
      const out = parseIntake(form(draft({ family: key })), CHOICES);
      expect(out.kind === 'ok' && out.fields.family).toBe(key);
    }
    // A family the code doesn't have yet isn't a choice.
    expect(parseIntake(form(draft({ family: 'luxury' })), { ...CHOICES, families: ['cozy'] })).toMatchObject({ kind: 'invalid', problem: { spot: 'mood' } });
  });

  it('takes the plan they signed up on, and how they pay', () => {
    const yearly = parseIntake(form(draft({ plan: 'full', billing: 'yearly' })), CHOICES);
    expect(yearly.kind === 'ok' && [yearly.fields.plan, yearly.fields.billing]).toEqual(['full', 'yearly']);
    // A plan the list doesn't have is no plan.
    expect(parseIntake(form(draft(), { [FIELD.plan]: 'gold' }), CHOICES)).toEqual({ kind: 'invalid', problem: { spot: 'plan', values: {} } });
    // Anything but yearly is monthly.
    const odd = parseIntake(form(draft(), { [FIELD.billing]: 'weekly' }), CHOICES);
    expect(odd.kind === 'ok' && odd.fields.billing).toBe('monthly');
  });

  it('an unknown family is no mood chosen', () => {
    const out = parseIntake(form(draft(), { [FIELD.family]: 'gothic' }), CHOICES);
    expect(out).toEqual({ kind: 'invalid', problem: { spot: 'mood', values: {} } });
  });

  it('a missing photo is named, even when the other pieces have theirs', () => {
    const d = draft();
    d.pieces[4] = { ...d.pieces[4]!, photo: null };
    expect(parseIntake(form(d), CHOICES)).toEqual({ kind: 'invalid', problem: { spot: 'piecePhoto', values: { n: 5 } } });
  });

  it('an empty form has no pieces', () => {
    const f = new FormData();
    expect(parseIntake(f, CHOICES)).toEqual({ kind: 'invalid', problem: { spot: 'plan', values: {} } });
    const g = form(draft({ pieces: [] }));
    g.set(FIELD.portrait, 'not a file');
    expect(parseIntake(g, CHOICES)).toEqual({ kind: 'invalid', problem: { spot: 'piecesFew', values: { min: MIN_PIECES } } });
  });
});

describe('isErrorSpot', () => {
  it('knows the form’s problems', () => {
    expect(isErrorSpot('email')).toBe(true);
    expect(isErrorSpot('nope')).toBe(false);
    expect(isErrorSpot(3)).toBe(false);
  });
});
