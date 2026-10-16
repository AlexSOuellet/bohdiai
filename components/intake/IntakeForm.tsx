'use client';

/**
 * bohdiai.com/start: what a maker sends us to start their site: the plan they
 * signed up on (filled in from the pricing page), then six things: who
 * they are, what they make, 5 to 10 pieces (one photo each), a few sentences
 * about themselves, their photo if they want, and a mood (one tile per family). Photos are shrunk here
 * before they're sent. Every word comes from the form's own words, and every
 * failure shows the maker something.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { fill } from '@/lib/site-words/words';
import type { IntakeWords } from '@/lib/intake/queries';
import type { FamilyKey } from '@/lib/archetypes/main-street/families';
import { formatPrice } from '@/lib/site/plans';
import { shrinkInBrowser } from '@/lib/intake/browser-photo';
import { answerStatus, type IntakeAnswer } from '@/lib/intake/answer';
import {
  checkIntake,
  FIELD,
  INTAKE_LIMITS,
  MAX_PIECES,
  MIN_PIECES,
  MOOD_PICK,
  PASSWORD_MAX,
  PASSWORD_MIN,
  BILLINGS,
  type Billing,
  type PlanTier,
  type IntakeProblem,
} from '@/lib/intake/request';

type Photo = { file: File; url: string };
type Piece = { key: string; name: string; price: string; description: string; photo: Photo | null };
type Fields = { plan: PlanTier | null; billing: Billing; password: string; makerName: string; businessName: string; email: string; makes: string; about: string; family: FamilyKey | typeof MOOD_PICK | ''; company: string };
type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | IntakeAnswer;

const EMPTY: Fields = { plan: null, billing: 'monthly', password: '', makerName: '', businessName: '', email: '', makes: '', about: '', family: '', company: '' };

const INPUT =
  'w-full appearance-none rounded-[10px] border border-white/[0.1] bg-black/40 px-3.5 py-3 font-sans text-[15px] text-text placeholder:text-text-soft/35 focus:border-honey-warm/50 focus:shadow-[0_0_0_3px_rgba(243,201,122,0.12)] focus:outline-none';
const LABEL = 'mb-1.5 block text-[12px] font-medium uppercase tracking-[0.14em] text-muted';
const HEADING = 'font-sans text-[22px] font-medium tracking-[-0.02em] text-text md:text-[26px]';
const HINT = 'mt-1.5 text-[14px] leading-[1.55] text-muted';
const SECTION = 'flex flex-col gap-4 border-t border-white/[0.08] pt-8 md:pt-10';

let nextKey = 0;
const newKey = (): string => `piece-${(nextKey += 1)}`;

/** A maker plan as the pricing list has it. */
export type IntakePlan = { tier: PlanTier; name: string; monthly: number; yearly: number };

type Props = {
  words: IntakeWords;
  looks: readonly { key: FamilyKey; texture: string }[];
  plans: readonly IntakePlan[];
  /** Filled in from the pricing page's button. */
  initialPlan: PlanTier | null;
  initialBilling: Billing;
  contactEmail: string;
};

export function IntakeForm({ words, looks, plans, initialPlan, initialBilling, contactEmail }: Props): React.ReactElement {
  const w = words;
  const [fields, setFields] = useState<Fields>({ ...EMPTY, plan: initialPlan, billing: initialBilling });
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [reading, setReading] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [portrait, setPortrait] = useState<Photo | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const urls = useRef(new Set<string>());

  // Free the photo previews when the form goes away.
  useEffect(() => {
    const held = urls.current;
    return () => held.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  function clearStatus(): void {
    if (status.kind === 'problem' || status.kind === 'message') setStatus({ kind: 'idle' });
  }
  function set<K extends keyof Fields>(key: K, value: Fields[K]): void {
    setFields((f) => ({ ...f, [key]: value }));
    clearStatus();
  }
  function setPiece(key: string, change: Partial<Piece>): void {
    setPieces((ps) => ps.map((p) => (p.key === key ? { ...p, ...change } : p)));
    clearStatus();
  }
  function hold(file: File): Photo {
    const url = URL.createObjectURL(file);
    urls.current.add(url);
    return { file, url };
  }
  function release(photo: Photo | null): void {
    if (photo === null) return;
    URL.revokeObjectURL(photo.url);
    urls.current.delete(photo.url);
  }

  /** Photos picked for new pieces: each becomes a piece once it's shrunk. */
  async function addPhotos(files: readonly File[]): Promise<void> {
    clearStatus();
    const room = MAX_PIECES - pieces.length - reading;
    const take = files.slice(0, Math.max(0, room));
    if (take.length === 0) return;
    setReading((n) => n + take.length);
    let unreadable = false;
    for (const file of take) {
      try {
        const small = await shrinkInBrowser(file);
        setPieces((ps) => [...ps, { key: newKey(), name: '', price: '', description: '', photo: hold(small) }]);
      } catch {
        unreadable = true;
      } finally {
        setReading((n) => n - 1);
      }
    }
    if (unreadable) setStatus({ kind: 'problem', problem: { spot: 'photoUnread', values: {} } });
  }

  function removePiece(key: string): void {
    const piece = pieces.find((p) => p.key === key);
    if (piece !== undefined) release(piece.photo);
    setPieces((ps) => ps.filter((p) => p.key !== key));
    clearStatus();
  }

  async function pickPortrait(file: File | undefined): Promise<void> {
    if (file === undefined) return;
    clearStatus();
    try {
      const small = await shrinkInBrowser(file);
      release(portrait);
      setPortrait(hold(small));
    } catch {
      setStatus({ kind: 'problem', problem: { spot: 'photoUnread', values: {} } });
    }
  }

  function problemText(p: IntakeProblem): string {
    return fill(w.errors[p.spot], p.values);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const problem = checkIntake({
      ...fields,
      family: fields.family === '' || fields.family === MOOD_PICK ? null : fields.family,
      familyChosen: fields.family !== '',
      portrait: portrait?.file ?? null,
      pieces: pieces.map((p) => ({ name: p.name, price: p.price, description: p.description, photo: p.photo?.file ?? null })),
    });
    if (problem !== null) {
      setStatus({ kind: 'problem', problem });
      return;
    }
    const form = new FormData();
    form.set(FIELD.plan, fields.plan ?? '');
    form.set(FIELD.billing, fields.billing);
    form.set(FIELD.name, fields.makerName);
    form.set(FIELD.business, fields.businessName);
    form.set(FIELD.email, fields.email);
    form.set(FIELD.password, fields.password);
    form.set(FIELD.makes, fields.makes);
    form.set(FIELD.about, fields.about);
    form.set(FIELD.family, fields.family);
    form.set(FIELD.honeypot, fields.company);
    if (portrait !== null) form.set(FIELD.portrait, portrait.file);
    for (const p of pieces) {
      form.append(FIELD.pieceName, p.name);
      form.append(FIELD.piecePrice, p.price);
      form.append(FIELD.pieceAbout, p.description);
      if (p.photo !== null) form.append(FIELD.piecePhoto, p.photo.file);
    }
    setStatus({ kind: 'sending' });
    const failed = fill(w.errors.failed, { email: contactEmail });
    try {
      const res = await fetch('/api/intake', { method: 'POST', body: form });
      if (res.ok) {
        setStatus({ kind: 'sent' });
        return;
      }
      const body: unknown = await res.json().catch(() => null);
      setStatus(answerStatus(body, failed));
    } catch {
      setStatus({ kind: 'message', message: failed });
    }
  }

  if (status.kind === 'sent') {
    return (
      <div role="status" className="rounded-[18px] border border-white/[0.08] bg-black/30 px-6 py-12 text-center">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full border border-honey-warm/40 bg-honey-warm/10 text-[20px] text-honey-warm shadow-[0_0_30px_-6px_rgba(243,201,122,0.6)]">
          ✓
        </div>
        <p className="font-sans text-[24px] font-medium tracking-[-0.02em] text-text">{w.sent.title}</p>
        <p className="mx-auto mt-2 max-w-[420px] text-[15px] leading-[1.6] text-muted">{w.sent.body}</p>
      </div>
    );
  }

  const sending = status.kind === 'sending';
  const count = pieces.length;
  const counter = count < MIN_PIECES ? fill(w.pieces.needed, { n: count, min: MIN_PIECES }) : fill(w.pieces.enough, { n: count });
  const full = count + reading >= MAX_PIECES;

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={sending} className="flex flex-col gap-8 text-left md:gap-10">
      <fieldset className="flex flex-col gap-4">
        <legend className={HEADING}>{w.plan.heading}</legend>
        <p className={`${HINT} -mt-2.5`}>{w.plan.hint}</p>
        <div className="flex w-fit rounded-pill border border-white/10 bg-black/40 p-1">
          {BILLINGS.map((b) => (
            <label
              key={b}
              className="cursor-pointer rounded-pill px-4 py-2 text-[13px] font-semibold text-muted transition-colors has-[:checked]:bg-honey-warm has-[:checked]:text-bg has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-honey-warm"
            >
              <input type="radio" name="billing" value={b} checked={fields.billing === b} onChange={() => set('billing', b)} className="sr-only" />
              {b === 'monthly' ? w.plan.monthly : w.plan.yearly}
            </label>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {plans.map((p) => (
            <label
              key={p.tier}
              className="flex cursor-pointer flex-col gap-1 rounded-[14px] border border-white/[0.1] bg-black/30 p-4 transition-colors has-[:checked]:border-honey-warm/70 has-[:checked]:bg-honey-warm/[0.06] has-[:checked]:shadow-[0_0_0_1px_rgba(243,201,122,0.5)] has-[:focus-visible]:shadow-[0_0_0_3px_rgba(243,201,122,0.35)]"
            >
              <input type="radio" name="plan" value={p.tier} checked={fields.plan === p.tier} onChange={() => set('plan', p.tier)} className="sr-only" />
              <span className="font-sans text-[18px] font-medium text-text">{p.name}</span>
              <span className="text-[14px] text-text-soft">
                {fill(fields.billing === 'monthly' ? w.plan.perMonth : w.plan.perYear, { price: formatPrice(fields.billing === 'monthly' ? p.monthly : p.yearly) })}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <section aria-labelledby="in-you" className={SECTION}>
        <h2 id="in-you" className={HEADING}>
          {w.you.heading}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="in-name" className={LABEL}>
              {w.you.name}
            </label>
            <input id="in-name" autoComplete="name" maxLength={INTAKE_LIMITS.name} value={fields.makerName} onChange={(e) => set('makerName', e.target.value)} className={INPUT} />
          </div>
          <div>
            <label htmlFor="in-business" className={LABEL}>
              {w.you.business}
            </label>
            <input id="in-business" autoComplete="organization" maxLength={INTAKE_LIMITS.business} value={fields.businessName} onChange={(e) => set('businessName', e.target.value)} className={INPUT} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="in-email" className={LABEL}>
              {w.you.email}
            </label>
            <input id="in-email" type="email" inputMode="email" autoComplete="email" maxLength={INTAKE_LIMITS.email} value={fields.email} onChange={(e) => set('email', e.target.value)} className={INPUT} />
          </div>
          <div>
            <label htmlFor="in-password" className={LABEL}>
              {w.you.password}
            </label>
            <div className="relative">
              <input
                id="in-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                maxLength={PASSWORD_MAX}
                value={fields.password}
                onChange={(e) => set('password', e.target.value)}
                aria-describedby="in-password-hint"
                className={`${INPUT} pr-20`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 px-3.5 text-[13px] font-medium text-text-soft hover:text-text focus-visible:text-honey-warm focus-visible:outline-none"
              >
                {showPassword ? w.you.hide : w.you.show}
              </button>
            </div>
            <p id="in-password-hint" className="mt-1 text-[12px] text-muted">
              {fill(w.you.passwordHint, { min: PASSWORD_MIN })}
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="in-makes" className={SECTION}>
        <div>
          <h2 id="in-makes" className={HEADING}>
            {w.makes.heading}
          </h2>
          <p className={HINT}>{w.makes.hint}</p>
        </div>
        <input aria-labelledby="in-makes" maxLength={INTAKE_LIMITS.makes} value={fields.makes} onChange={(e) => set('makes', e.target.value)} className={INPUT} />
      </section>

      <section aria-labelledby="in-pieces" className={SECTION}>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <h2 id="in-pieces" className={HEADING}>
              {w.pieces.heading}
            </h2>
            <p className={HINT}>{w.pieces.hint}</p>
          </div>
          <p aria-live="polite" className={count < MIN_PIECES ? 'text-[14px] font-medium text-honey-warm' : 'text-[14px] font-medium text-text-soft'}>
            {counter}
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {pieces.map((p, i) => (
            <li key={p.key} className="flex flex-col overflow-hidden rounded-[14px] border border-white/[0.08] bg-black/30">
              <div className="relative aspect-square bg-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element -- a preview of a photo on the maker's own device */}
                {p.photo !== null && <img src={p.photo.url} alt={fill(w.pieces.photoAlt, { name: p.name.trim() === '' ? String(i + 1) : p.name })} className="size-full object-cover" />}
                <button
                  type="button"
                  onClick={() => removePiece(p.key)}
                  aria-label={fill(w.pieces.remove, { n: i + 1 })}
                  className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-black/70 text-[18px] leading-none text-text-soft hover:text-text focus-visible:shadow-[0_0_0_3px_rgba(243,201,122,0.35)] focus-visible:outline-none"
                >
                  ×
                </button>
              </div>
              <div className="flex flex-col gap-3 p-3.5">
                <div>
                  <label htmlFor={`${p.key}-name`} className={LABEL}>
                    {w.pieces.name}
                  </label>
                  <input id={`${p.key}-name`} maxLength={INTAKE_LIMITS.pieceName} value={p.name} onChange={(e) => setPiece(p.key, { name: e.target.value })} className={INPUT} />
                </div>
                <div>
                  <label htmlFor={`${p.key}-price`} className={LABEL}>
                    {w.pieces.price}
                  </label>
                  <input
                    id={`${p.key}-price`}
                    inputMode="decimal"
                    maxLength={INTAKE_LIMITS.price}
                    value={p.price}
                    onChange={(e) => setPiece(p.key, { price: e.target.value })}
                    aria-describedby={`${p.key}-price-hint`}
                    className={INPUT}
                  />
                  <p id={`${p.key}-price-hint`} className="mt-1 text-[12px] text-muted">
                    {w.pieces.priceHint}
                  </p>
                </div>
                <div>
                  <label htmlFor={`${p.key}-about`} className={LABEL}>
                    {w.pieces.about} <span className="normal-case tracking-normal">{w.pieces.optional}</span>
                  </label>
                  <textarea
                    id={`${p.key}-about`}
                    rows={2}
                    maxLength={INTAKE_LIMITS.pieceAbout}
                    value={p.description}
                    onChange={(e) => setPiece(p.key, { description: e.target.value })}
                    className={`${INPUT} resize-y leading-[1.5]`}
                  />
                </div>
              </div>
            </li>
          ))}

          {Array.from({ length: reading }, (_, i) => (
            <li key={`reading-${i}`} className="grid aspect-square place-items-center rounded-[14px] border border-white/[0.08] bg-black/30 text-[14px] text-muted">
              {w.pieces.reading}
            </li>
          ))}

          {!full && (
            <li>
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed border-honey-warm/35 bg-honey-warm/[0.04] px-6 text-center transition-colors hover:border-honey-warm/60 hover:bg-honey-warm/[0.08] has-[:focus-visible]:shadow-[0_0_0_3px_rgba(243,201,122,0.3)]">
                <span aria-hidden="true" className="grid size-12 place-items-center rounded-full border border-honey-warm/40 text-[24px] leading-none text-honey-warm">
                  +
                </span>
                <span className="text-[15px] font-medium text-text">{w.pieces.add}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    const picked = [...(e.target.files ?? [])];
                    e.target.value = '';
                    void addPhotos(picked);
                  }}
                />
              </label>
            </li>
          )}
        </ul>
        {full && <p className="text-[14px] text-muted">{w.pieces.full}</p>}
      </section>

      <section aria-labelledby="in-about" className={SECTION}>
        <div>
          <h2 id="in-about" className={HEADING}>
            {w.about.heading}
          </h2>
          <p className={HINT}>{w.about.hint}</p>
        </div>
        <textarea aria-labelledby="in-about" rows={6} maxLength={INTAKE_LIMITS.about} value={fields.about} onChange={(e) => set('about', e.target.value)} className={`${INPUT} resize-y leading-[1.6]`} />
      </section>

      <section aria-labelledby="in-portrait" className={SECTION}>
        <div>
          <h2 id="in-portrait" className={HEADING}>
            {w.portrait.heading}
          </h2>
          <p className={HINT}>{w.portrait.hint}</p>
        </div>
        <div className="flex items-center gap-5">
          <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border border-white/[0.1] bg-black/40 md:size-28">
            {/* eslint-disable-next-line @next/next/no-img-element -- a preview of a photo on the maker's own device */}
            {portrait !== null && <img src={portrait.url} alt={w.portrait.alt} className="size-full object-cover" />}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer rounded-pill border border-white/[0.12] bg-white/[0.03] px-5 py-2.5 text-[13px] font-semibold text-text-soft hover:text-text has-[:focus-visible]:shadow-[0_0_0_3px_rgba(243,201,122,0.3)]">
              {portrait === null ? w.portrait.add : w.portrait.change}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  void pickPortrait(file);
                }}
              />
            </label>
            {portrait !== null && (
              <button
                type="button"
                onClick={() => {
                  release(portrait);
                  setPortrait(null);
                }}
                className="rounded-pill px-4 py-2.5 text-[13px] text-muted hover:text-text"
              >
                {w.portrait.remove}
              </button>
            )}
          </div>
        </div>
      </section>

      <fieldset className={SECTION}>
        <legend className={HEADING}>{w.mood.heading}</legend>
        <p className={`${HINT} -mt-2.5`}>{w.mood.hint}</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {looks.map(({ key: m, texture }) => (
            <label
              key={m}
              className="group relative isolate flex min-h-[132px] cursor-pointer flex-col justify-end overflow-hidden rounded-[14px] border border-white/[0.1] p-4 transition-colors has-[:checked]:border-honey-warm/70 has-[:checked]:shadow-[0_0_0_1px_rgba(243,201,122,0.5),0_0_32px_-8px_rgba(243,201,122,0.5)] has-[:focus-visible]:shadow-[0_0_0_3px_rgba(243,201,122,0.35)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a small texture swatch, painted as the tile's ground */}
              <img src={texture} alt="" aria-hidden="true" className="absolute inset-0 -z-10 size-full object-cover opacity-70 transition-opacity group-hover:opacity-90" />
              <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
              <input type="radio" name="family" value={m} checked={fields.family === m} onChange={() => set('family', m)} className="sr-only" />
              <span className="font-sans text-[18px] font-medium text-text">{w.families[m].label}</span>
              <span className="mt-1 text-[13px] leading-[1.45] text-text-soft">{w.families[m].line}</span>
            </label>
          ))}
          <label className="relative flex min-h-[132px] cursor-pointer flex-col justify-end rounded-[14px] border border-dashed border-white/[0.16] bg-white/[0.02] p-4 transition-colors has-[:checked]:border-honey-warm/70 has-[:checked]:bg-honey-warm/[0.06] has-[:focus-visible]:shadow-[0_0_0_3px_rgba(243,201,122,0.35)] col-span-2 md:col-span-3">
            <input type="radio" name="family" value={MOOD_PICK} checked={fields.family === MOOD_PICK} onChange={() => set('family', MOOD_PICK)} className="sr-only" />
            <span className="font-sans text-[18px] font-medium text-text">{w.mood.pick.label}</span>
            <span className="mt-1 text-[13px] leading-[1.45] text-text-soft">{w.mood.pick.line}</span>
          </label>
        </div>
      </fieldset>

      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <input id="in-company" tabIndex={-1} autoComplete="off" value={fields.company} onChange={(e) => set('company', e.target.value)} />
      </div>

      <div className="flex flex-col items-center gap-4 border-t border-white/[0.08] pt-8">
        {status.kind === 'problem' && (
          <p role="alert" className="text-center text-[14px] text-honey-warm">
            {problemText(status.problem)}
          </p>
        )}
        {status.kind === 'message' && (
          <p role="alert" className="text-center text-[14px] text-honey-warm">
            {status.message}
          </p>
        )}
        <button
          type="submit"
          disabled={sending || reading > 0}
          className="w-full rounded-pill bg-text px-8 py-4 font-sans text-[15px] font-semibold text-bg transition-transform hover:-translate-y-px disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 md:w-auto"
        >
          {sending ? w.send.sending : w.send.button}
        </button>
      </div>
    </form>
  );
}
