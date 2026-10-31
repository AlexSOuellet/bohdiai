'use client';

/**
 * The check-your-email screen's two buttons (Alex, Session 119): send the link
 * again, or fix a mistyped email and send it there. Every word is the form's own,
 * and every failure shows the maker something.
 */
import { useState, type FormEvent } from 'react';
import { fill } from '@/lib/site-words/words';
import type { IntakeWords } from '@/lib/intake/queries';
import { answerStatus, type IntakeAnswer } from '@/lib/intake/answer';
import { INTAKE_LIMITS } from '@/lib/intake/request';

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | IntakeAnswer;

const BUTTON = 'rounded-pill border border-white/20 px-5 py-2.5 text-[14px] font-semibold text-text transition-transform hover:-translate-y-px disabled:cursor-wait disabled:opacity-60';

type Props = { words: IntakeWords; session: string; email: string; contactEmail: string };

export function CheckEmail({ words, session, email: first, contactEmail }: Props): React.ReactElement {
  const w = words;
  const [email, setEmail] = useState(first);
  const [fixing, setFixing] = useState(false);
  const [typed, setTyped] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function post(body: { session: string; email?: string }): Promise<void> {
    setStatus({ kind: 'sending' });
    const failed = fill(w.errors.failed, { email: contactEmail });
    try {
      const res = await fetch('/api/signup/again', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const answer: unknown = await res.json().catch(() => null);
      if (res.ok && answer !== null && typeof answer === 'object' && 'email' in answer && typeof answer.email === 'string') {
        setEmail(answer.email);
        setFixing(false);
        setStatus({ kind: 'sent' });
        return;
      }
      setStatus(answerStatus(answer, failed));
    } catch {
      setStatus({ kind: 'message', message: failed });
    }
  }

  function onFix(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    void post({ session, email: typed });
  }

  const sending = status.kind === 'sending';
  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      <p className="mx-auto max-w-[440px] text-[15px] leading-[1.6] text-muted">{fill(w.paid.body, { email })}</p>
      <p className="mx-auto max-w-[440px] text-[14px] leading-[1.6] text-muted">{w.paid.spam}</p>
      {status.kind === 'sent' && (
        <p role="status" className="text-[14px] text-honey-warm">
          {fill(w.paid.sent, { email })}
        </p>
      )}
      {status.kind === 'problem' && (
        <p role="alert" className="text-[14px] text-honey-warm">
          {fill(w.errors[status.problem.spot], status.problem.values)}
        </p>
      )}
      {status.kind === 'message' && (
        <p role="alert" className="text-[14px] text-honey-warm">
          {status.message}
        </p>
      )}
      {fixing ? (
        <form onSubmit={onFix} noValidate className="flex w-full max-w-[440px] flex-col gap-3 text-left">
          <label htmlFor="ce-email" className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
            {w.paid.fixLabel}
          </label>
          <input
            id="ce-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={INTAKE_LIMITS.email}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="w-full rounded-[10px] border border-white/[0.1] bg-black/40 px-3.5 py-3 text-[15px] text-text focus:border-honey-warm/50 focus:outline-none"
          />
          <div className="flex flex-wrap justify-center gap-3">
            <button type="submit" disabled={sending} className={BUTTON}>
              {w.paid.fixButton}
            </button>
            <button type="button" onClick={() => setFixing(false)} className={BUTTON}>
              {w.paid.cancel}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" disabled={sending} onClick={() => void post({ session })} className={BUTTON}>
            {w.paid.again}
          </button>
          <button type="button" onClick={() => setFixing(true)} className={BUTTON}>
            {w.paid.wrong}
          </button>
        </div>
      )}
    </div>
  );
}
