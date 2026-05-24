'use client';

import { useState } from 'react';
import type { OnboardingData } from './types';

interface StepNameProps {
  data: OnboardingData;
  onAdvance: (patch: Partial<OnboardingData>) => void;
}

export default function StepName({ data, onAdvance }: StepNameProps) {
  const [name, setName] = useState(data.name);
  const trimmed = name.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed) return;
    onAdvance({ name: trimmed });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h1 className="mb-2 font-serif text-3xl text-text">What's your name?</h1>
        <p className="text-sm text-muted">We'll use this to personalize your store.</p>
      </div>

      <div>
        <label htmlFor="name" className="sr-only">
          Your name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="given-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-lg border border-white/10 bg-bg-2 px-4 py-3 text-lg text-text placeholder:text-muted focus:border-honey/60 focus:outline-none focus:ring-1 focus:ring-honey/40"
        />
      </div>

      <button
        type="submit"
        disabled={!trimmed}
        className="w-full rounded-lg bg-honey px-6 py-3 font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Continue
      </button>
    </form>
  );
}
