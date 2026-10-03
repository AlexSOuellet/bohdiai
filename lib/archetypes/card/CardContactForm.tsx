'use client';

/**
 * Business card — the contact form. Posts to /api/contact (name, email, message
 * plus the tenant id), which emails the owner. Every failure says so.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { CARD_STRINGS as S } from './strings';

type State = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string };

export function CardContactForm({ tenantId }: { tenantId: string }): ReactElement {
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    if (String(data.get('company') ?? '') !== '') {
      setState({ kind: 'sent' });
      return;
    }
    setState({ kind: 'sending' });
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, name: data.get('name'), email: data.get('email'), message: data.get('message') }),
      });
      if (res.ok) {
        form.reset();
        setState({ kind: 'sent' });
        return;
      }
      const body: unknown = await res.json().catch(() => null);
      const message = body !== null && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : S.form.error;
      setState({ kind: 'error', message });
    } catch {
      setState({ kind: 'error', message: S.form.errorNetwork });
    }
  }

  if (state.kind === 'sent') {
    return (
      <div className="bc-form__done" role="status">
        <p>{S.form.sent}</p>
        <button type="button" className="bc-btn" onClick={() => setState({ kind: 'idle' })}>
          {S.form.sendAnother}
        </button>
      </div>
    );
  }

  return (
    <form className="bc-form" id="contact-form" onSubmit={onSubmit}>
      <div className="bc-form__row">
        <label>
          {S.form.name}
          <input name="name" required maxLength={120} autoComplete="name" />
        </label>
        <label>
          {S.form.email}
          <input name="email" type="email" required maxLength={254} autoComplete="email" />
        </label>
      </div>
      <label>
        {S.form.message}
        <textarea name="message" required maxLength={5000} />
      </label>
      <label className="bc-form__trap" aria-hidden="true">
        {S.form.honeypot}
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>
      <button className="bc-btn" type="submit" disabled={state.kind === 'sending'}>
        {state.kind === 'sending' ? S.form.sending : S.form.send}
      </button>
      {state.kind === 'error' && (
        <p className="bc-form__status" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
