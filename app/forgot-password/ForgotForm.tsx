'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/lib/backend/auth-actions';

export default function ForgotForm(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await requestPasswordReset({ email });
      if (result.ok) setDone(result.message ?? '');
      else setError(result.error);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done !== '') return <p role="status" className="bk-note">{done}</p>;
  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="bk-field">
        <label htmlFor="email" className="bk-label">Email</label>
        <input id="email" type="email" autoComplete="email" className="bk-input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {error !== '' && <p role="alert" className="bk-error">{error}</p>}
      <button type="submit" className="bk-btn" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
      <p className="bk-note"><Link href="/signin" className="bk-link">Back to sign in</Link></p>
    </form>
  );
}
