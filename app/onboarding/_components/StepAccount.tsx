'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signUpMaker } from '@/lib/auth/actions';
import GoogleButton from '@/components/auth/GoogleButton';
import type { OnboardingData } from './types';

interface StepAccountProps {
  onAdvance: (patch: Partial<OnboardingData>) => void;
}

const inputClass =
  'w-full rounded-lg border border-white/10 bg-bg-2 px-4 py-3 text-lg text-text placeholder:text-muted focus:border-honey/60 focus:outline-none focus:ring-1 focus:ring-honey/40';

export default function StepAccount({ onAdvance }: StepAccountProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const result = await signUpMaker({ email, password });
    if (result.ok) {
      onAdvance({});
      return;
    }
    setError(result.error);
    setBusy(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 font-serif text-3xl text-text">Let&apos;s build your shop.</h1>
        <p className="text-sm text-muted">Create your account — it takes a few seconds.</p>
      </div>

      <GoogleButton next="/onboarding" />

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-white/10" />
        or
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm text-text-soft">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm text-text-soft">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={inputClass}
          />
        </div>

        {error !== '' && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-honey px-6 py-3 font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? 'Creating your account…' : 'Create my account'}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        Already have a shop?{' '}
        <Link href="/signin" className="text-honey hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
