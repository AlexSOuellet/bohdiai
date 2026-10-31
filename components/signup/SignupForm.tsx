'use client';

/**
 * bohdiai.com/start, the first step (Alex, Session 119): the plan (Free too), who
 * they are and their account, then straight to Stripe's own page to pay. Nothing
 * about the site yet; that comes after the email is confirmed. Every word comes
 * from the form's own words, and every failure shows the maker something.
 */
import { useState, type FormEvent } from 'react';
import { fill } from '@/lib/site-words/words';
import type { IntakeWords } from '@/lib/intake/queries';
import { formatPrice } from '@/lib/site/plans';
import { answerStatus, type IntakeAnswer } from '@/lib/intake/answer';
import { BILLINGS, INTAKE_LIMITS, PASSWORD_MAX, PASSWORD_MIN, type Billing, type IntakeProblem } from '@/lib/intake/request';
import { FREE_PLAN, type AccountPlan } from '@/lib/backend/plan/plan';
import { checkSignup, SIGNUP_FIELD } from '@/lib/signup/request';

type Fields = { plan: AccountPlan | null; billing: Billing; makerName: string; businessName: string; email: string; password: string; company: string };
type Status = { kind: 'idle' } | { kind: 'sending' } | IntakeAnswer;

const INPUT =
  'w-full appearance-none rounded-[10px] border border-white/[0.1] bg-black/40 px-3.5 py-3 font-sans text-[15px] text-text placeholder:text-text-soft/35 focus:border-honey-warm/50 focus:shadow-[0_0_0_3px_rgba(243,201,122,0.12)] focus:outline-none';
const LABEL = 'mb-1.5 block text-[12px] font-medium uppercase tracking-[0.14em] text-muted';
const HEADING = 'font-sans text-[22px] font-medium tracking-[-0.02em] text-text md:text-[26px]';
const SECTION = 'flex flex-col gap-4 border-t border-white/[0.08] pt-8 md:pt-10';

/** A plan tile: Free (no price) or a maker plan as the pricing list has it. */
export type SignupPlan = { plan: AccountPlan; name: string; monthly: number; yearly: number };

type Props = {
  words: IntakeWords;
  plans: readonly SignupPlan[];
  /** Filled in from the pricing page's button. */
  initialPlan: AccountPlan | null;
  initialBilling: Billing;
  /** Stripe's back button brought them here. */
  back: boolean;
  contactEmail: string;
};

export function SignupForm({ words, plans, initialPlan, initialBilling, back, contactEmail }: Props): React.ReactElement {
  const w = words;
  const [fields, setFields] = useState<Fields>({ plan: initialPlan, billing: initialBilling, makerName: '', businessName: '', email: '', password: '', company: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  function set<K extends keyof Fields>(key: K, value: Fields[K]): void {
    setFields((f) => ({ ...f, [key]: value }));
    if (status.kind === 'problem' || status.kind === 'message') setStatus({ kind: 'idle' });
  }

  function problemText(p: IntakeProblem): string {
    return fill(w.errors[p.spot], p.values);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const problem = checkSignup(fields);
    if (problem !== null) {
      setStatus({ kind: 'problem', problem });
      return;
    }
    setStatus({ kind: 'sending' });
    const failed = fill(w.errors.failed, { email: contactEmail });
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          [SIGNUP_FIELD.plan]: fields.plan,
          [SIGNUP_FIELD.billing]: fields.billing,
          [SIGNUP_FIELD.name]: fields.makerName,
          [SIGNUP_FIELD.business]: fields.businessName,
          [SIGNUP_FIELD.email]: fields.email,
          [SIGNUP_FIELD.password]: fields.password,
          [SIGNUP_FIELD.honeypot]: fields.company,
        }),
      });
      const body: unknown = await res.json().catch(() => null);
      if (res.ok && body !== null && typeof body === 'object' && 'url' in body && typeof body.url === 'string') {
        // Straight to Stripe's own page; the button stays busy while it opens.
        window.location.assign(body.url);
        return;
      }
      setStatus(answerStatus(body, failed));
    } catch {
      setStatus({ kind: 'message', message: failed });
    }
  }

  const sending = status.kind === 'sending';
  const isFree = fields.plan === FREE_PLAN;

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={sending} className="flex flex-col gap-8 text-left md:gap-10">
      {back && (
        <p role="status" className="rounded-[14px] border border-honey-warm/30 bg-honey-warm/[0.06] px-4 py-3 text-[14px] leading-[1.55] text-text-soft">
          {w.signup.back}
        </p>
      )}

      <fieldset className="flex flex-col gap-4">
        <legend className={HEADING}>{w.plan.heading}</legend>
        <p className="-mt-2.5 text-[14px] leading-[1.55] text-muted">{w.plan.hint}</p>
        {!isFree && (
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
        )}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {plans.map((p) => (
            <label
              key={p.plan}
              className="flex cursor-pointer flex-col gap-1 rounded-[14px] border border-white/[0.1] bg-black/30 p-4 transition-colors has-[:checked]:border-honey-warm/70 has-[:checked]:bg-honey-warm/[0.06] has-[:checked]:shadow-[0_0_0_1px_rgba(243,201,122,0.5)] has-[:focus-visible]:shadow-[0_0_0_3px_rgba(243,201,122,0.35)]"
            >
              <input type="radio" name="plan" value={p.plan} checked={fields.plan === p.plan} onChange={() => set('plan', p.plan)} className="sr-only" />
              <span className="font-sans text-[18px] font-medium text-text">{p.name}</span>
              <span className="text-[14px] text-text-soft">
                {p.plan === FREE_PLAN
                  ? w.signup.free
                  : fill(fields.billing === 'monthly' ? w.plan.perMonth : w.plan.perYear, { price: formatPrice(fields.billing === 'monthly' ? p.monthly : p.yearly) })}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <section aria-labelledby="su-you" className={SECTION}>
        <h2 id="su-you" className={HEADING}>
          {w.you.heading}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="su-name" className={LABEL}>
              {w.you.name}
            </label>
            <input id="su-name" autoComplete="name" maxLength={INTAKE_LIMITS.name} value={fields.makerName} onChange={(e) => set('makerName', e.target.value)} className={INPUT} />
          </div>
          <div>
            <label htmlFor="su-business" className={LABEL}>
              {w.you.business}
            </label>
            <input id="su-business" autoComplete="organization" maxLength={INTAKE_LIMITS.business} value={fields.businessName} onChange={(e) => set('businessName', e.target.value)} className={INPUT} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="su-email" className={LABEL}>
              {w.you.email}
            </label>
            <input id="su-email" type="email" inputMode="email" autoComplete="email" maxLength={INTAKE_LIMITS.email} value={fields.email} onChange={(e) => set('email', e.target.value)} className={INPUT} />
          </div>
          <div>
            <label htmlFor="su-password" className={LABEL}>
              {w.you.password}
            </label>
            <div className="relative">
              <input
                id="su-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                maxLength={PASSWORD_MAX}
                value={fields.password}
                onChange={(e) => set('password', e.target.value)}
                aria-describedby="su-password-hint"
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
            <p id="su-password-hint" className="mt-1 text-[12px] text-muted">
              {fill(w.you.passwordHint, { min: PASSWORD_MIN })}
            </p>
          </div>
        </div>
      </section>

      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <input id="su-company" tabIndex={-1} autoComplete="off" value={fields.company} onChange={(e) => set('company', e.target.value)} />
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
          disabled={sending}
          className="w-full rounded-pill bg-text px-8 py-4 font-sans text-[15px] font-semibold text-bg transition-transform hover:-translate-y-px disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 md:w-auto"
        >
          {sending ? w.signup.sending : w.signup.button}
        </button>
      </div>
    </form>
  );
}
