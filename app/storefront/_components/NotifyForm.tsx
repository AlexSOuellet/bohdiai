'use client';

import { useState } from 'react';

interface NotifyFormProps {
  tenantId: string;
  listingId: string;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function NotifyForm({ tenantId, listingId }: NotifyFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');
    try {
      const res = await fetch('/api/notify-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, listingId, email }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setStatus('error');
        setErrorMessage(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <p className="font-s-body text-sm text-s-text/70 italic">
        Thanks — we&apos;ll let you know when this launches.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mt-2" noValidate>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        maxLength={254}
        disabled={status === 'submitting'}
        placeholder="you@email.com"
        aria-label="Email address"
        className="flex-1 px-3 py-2 bg-s-surface border border-s-border text-s-text placeholder:text-s-text/40 font-s-body text-sm focus:outline-none focus:border-s-accent transition-colors"
      />
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="px-4 py-2 bg-s-accent text-white font-s-body uppercase tracking-[0.15em] text-xs hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
      >
        {status === 'submitting' ? 'Sending…' : 'Get Notified'}
      </button>
      {status === 'error' && (
        <p className="font-s-body text-xs text-red-600 w-full" role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
