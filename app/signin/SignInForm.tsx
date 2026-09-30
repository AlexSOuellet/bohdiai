'use client';

import { useState } from 'react';
import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
import { signIn } from '@/lib/backend/auth-actions';

export default function SignInForm(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await signIn({ email, password });
      if (!result.ok) setError(result.error);
    } catch (err) {
      // A successful sign-in redirects by throwing Next's redirect signal; let Next handle it.
      unstable_rethrow(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="bk-field">
        <label htmlFor="email" className="bk-label">Email</label>
        <input id="email" type="email" autoComplete="email" className="bk-input" aria-invalid={error !== ''} aria-describedby={error !== '' ? 'signin-error' : undefined} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="bk-field">
        <label htmlFor="password" className="bk-label">Password</label>
        <input id="password" type="password" autoComplete="current-password" className="bk-input" aria-invalid={error !== ''} aria-describedby={error !== '' ? 'signin-error' : undefined} value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error !== '' && <p id="signin-error" role="alert" className="bk-error">{error}</p>}
      <button type="submit" className="bk-btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      <p className="bk-note"><Link href="/forgot-password" className="bk-link">Forgot password?</Link></p>
    </form>
  );
}
