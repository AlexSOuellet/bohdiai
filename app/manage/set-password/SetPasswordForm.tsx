'use client';

import { useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { setPassword } from '@/lib/backend/auth-actions';

export default function SetPasswordForm(): React.ReactElement {
  const [password, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await setPassword({ password, confirm });
      if (!result.ok) setError(result.error);
    } catch (err) {
      unstable_rethrow(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="bk-field">
        <label htmlFor="pw" className="bk-label">New password</label>
        <input id="pw" type="password" autoComplete="new-password" className="bk-input" value={password} onChange={(e) => setPw(e.target.value)} />
      </div>
      <div className="bk-field">
        <label htmlFor="pw2" className="bk-label">Type it again</label>
        <input id="pw2" type="password" autoComplete="new-password" className="bk-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <p className="bk-note">At least 10 characters.</p>
      {error !== '' && <p role="alert" className="bk-error">{error}</p>}
      <button type="submit" className="bk-btn" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
    </form>
  );
}
