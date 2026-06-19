'use client';

import { useState } from 'react';
import { signInWithGoogle } from '@/lib/auth/oauth';

interface GoogleButtonProps {
  /** Where to land after the Google round-trip (defaults to home). */
  next?: string;
  label?: string;
}

/**
 * "Continue with Google" — the one social provider at launch. Shared by the
 * onboarding account step and the /signin page. On success the browser is
 * redirected away by supabase-js; we only surface a message if the start fails.
 */
export default function GoogleButton({ next, label = 'Continue with Google' }: GoogleButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleClick() {
    setBusy(true);
    setError('');
    const result = await signInWithGoogle(next);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
    }
    // On success the page navigates to Google — nothing more to do here.
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/15 bg-bg-2 px-6 py-3 font-medium text-text transition-colors hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <GoogleGlyph />
        {busy ? 'Connecting…' : label}
      </button>
      {error !== '' && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.98 8.98 0 0 0 9 0 9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
