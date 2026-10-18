'use client';

/**
 * The small question box (Alex, Session 108): on the makers arm for a question
 * before signing up or a custom site, on the parent for anything that fits
 * neither door. Only a name, an email and the question; it posts to
 * /api/inquiry like the full form, as `kind`. Every
 * failure path shows the visitor something, with Alex's address as the way out.
 */
import { useState, type FormEvent } from 'react';
import { INPUT, LABEL } from '@/components/InquiryForm';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import type { InquiryKind } from '@/lib/inquiry/request';

type Fields = { name: string; email: string; message: string; company: string };
type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string };

const EMPTY: Fields = { name: '', email: '', message: '', company: '' };
const FALLBACK = `Something went wrong. Please try again, or email me at ${SITE_CONTACT_EMAIL}.`;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mirrors the server's required fields and messages, so most mistakes never leave the page. */
export function checkQuestion(f: Fields): string | null {
  if (f.name.trim() === '') return 'Please add your name.';
  if (!EMAIL_SHAPE.test(f.email.trim())) return 'That email doesn’t look right.';
  if (f.message.trim() === '') return 'Write your question first.';
  return null;
}

/** `lit` when the box is the page's own ending (the parent); quiet under a bigger call to start (the makers arm). */
export function QuestionForm({ kind, lit = false }: { kind: InquiryKind; lit?: boolean }): React.ReactElement {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  function set<K extends keyof Fields>(key: K, value: Fields[K]): void {
    setFields((f) => ({ ...f, [key]: value }));
    if (status.kind === 'error') setStatus({ kind: 'idle' });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const problem = checkQuestion(fields);
    if (problem !== null) {
      setStatus({ kind: 'error', message: problem });
      return;
    }
    setStatus({ kind: 'sending' });
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...fields, kind, contactBy: 'email' }),
      });
      if (res.ok) {
        setFields(EMPTY);
        setStatus({ kind: 'sent' });
        return;
      }
      const body: unknown = await res.json().catch(() => null);
      const message =
        body !== null && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string'
          ? (body as { error: string }).error
          : FALLBACK;
      setStatus({ kind: 'error', message });
    } catch {
      setStatus({ kind: 'error', message: FALLBACK });
    }
  }

  if (status.kind === 'sent') {
    return (
      <div role="status" className="py-4 text-center">
        <p className="font-sans text-[20px] font-medium tracking-[-0.02em] text-text">Thanks, it’s on its way</p>
        <p className="mx-auto mt-2 max-w-[380px] text-[14px] leading-[1.55] text-muted">
          I read every message myself and I’ll get back to you within a couple of days.
        </p>
        <button
          type="button"
          onClick={() => setStatus({ kind: 'idle' })}
          className="mt-4 rounded-pill border border-white/[0.12] bg-white/[0.03] px-5 py-2.5 text-[13px] font-semibold text-text-soft"
        >
          Ask something else
        </button>
      </div>
    );
  }

  const sending = status.kind === 'sending';
  return (
    <form onSubmit={onSubmit} noValidate aria-busy={sending} className="flex flex-col gap-4 text-left">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="qf-name" className={LABEL}>
            Your name
          </label>
          <input id="qf-name" autoComplete="name" value={fields.name} onChange={(e) => set('name', e.target.value)} className={INPUT} />
        </div>
        <div>
          <label htmlFor="qf-email" className={LABEL}>
            Email
          </label>
          <input
            id="qf-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={fields.email}
            onChange={(e) => set('email', e.target.value)}
            className={INPUT}
          />
        </div>
      </div>
      <div>
        <label htmlFor="qf-message" className={LABEL}>
          Your question
        </label>
        <textarea
          id="qf-message"
          rows={4}
          value={fields.message}
          onChange={(e) => set('message', e.target.value)}
          className={`${INPUT} resize-y`}
        />
      </div>

      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="qf-company">Company</label>
        <input id="qf-company" tabIndex={-1} autoComplete="off" value={fields.company} onChange={(e) => set('company', e.target.value)} />
      </div>

      {status.kind === 'error' && (
        <p role="alert" className="text-center text-[13px] text-honey-warm">
          {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className={
          lit
            ? 'inline-flex items-center justify-center gap-2 rounded-pill bg-honey-warm px-6 py-3.5 text-[15px] font-semibold text-bg shadow-[0_10px_40px_-10px_rgba(243,201,122,0.7)] transition-transform hover:-translate-y-px disabled:cursor-wait disabled:opacity-60'
            : 'inline-flex items-center justify-center gap-2 rounded-pill border border-white/[0.12] bg-white/[0.05] px-5 py-3 text-[14px] font-semibold text-text-soft transition-colors hover:border-honey-warm/50 disabled:cursor-wait disabled:opacity-60'
        }
      >
        {sending ? 'Sending…' : lit ? 'Send it to me →' : 'Send my question'}
      </button>
    </form>
  );
}
