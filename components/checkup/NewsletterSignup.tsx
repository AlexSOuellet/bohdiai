'use client';

import { useState, type FormEvent } from 'react';

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'done' } | { kind: 'error'; message: string };

const FAILED = 'That didn’t go through. Please try again in a minute.';

/** "Free tips and tricks": adds the visitor to Alex's newsletter. */
export function NewsletterSignup(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function submit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (email.trim() === '') {
      setStatus({ kind: 'error', message: 'Please enter your email.' });
      return;
    }
    setStatus({ kind: 'sending' });
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, company }),
      });
      if (res.ok) {
        setStatus({ kind: 'done' });
        return;
      }
      const body: unknown = await res.json().catch(() => null);
      const message =
        body !== null && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
          ? body.error
          : FAILED;
      setStatus({ kind: 'error', message });
    } catch {
      setStatus({ kind: 'error', message: FAILED });
    }
  }

  if (status.kind === 'done') {
    return (
      <p className="checkup-hand text-[28px] leading-[1.15] text-honey-warm" role="status">
        You’re in. Watch your inbox, the first tips are on their way.
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3 md:flex-row md:flex-wrap">
      <label htmlFor="checkup-email" className="sr-only">
        Your email
      </label>
      <input
        id="checkup-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="min-h-[52px] flex-1 rounded-md border border-text/15 bg-bg-2 px-4 text-[17px] text-text placeholder:text-muted focus:border-honey-warm focus:outline-none"
      />
      {/* Honeypot: people never see it, bots fill it. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        className="absolute left-[-9999px] h-px w-px opacity-0"
      />
      <button
        type="submit"
        disabled={status.kind === 'sending'}
        className="min-h-[52px] rounded-md bg-honey px-6 text-[16px] font-semibold text-bg transition-colors hover:bg-honey-warm disabled:opacity-60"
      >
        {status.kind === 'sending' ? 'Signing you up…' : 'Send me the tips'}
      </button>
      {status.kind === 'error' && (
        <p role="alert" className="text-[15px] text-honey-warm md:basis-full">
          {status.message}
        </p>
      )}
    </form>
  );
}
