'use client';

import { useState } from 'react';
import type { OnboardingData } from './types';

interface StepNameProps {
  data: OnboardingData;
  onAdvance: (patch: Partial<OnboardingData>) => void;
}

export default function StepName({ data, onAdvance }: StepNameProps) {
  const [shopName, setShopName] = useState(data.shopName);
  const trimmed = shopName.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed) return;
    onAdvance({ shopName: trimmed });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h1 className="mb-2 font-serif text-3xl text-text">What's your shop called?</h1>
        <p className="text-sm text-muted">You can always change this later.</p>
      </div>

      <div>
        <label htmlFor="shopName" className="sr-only">
          Shop name
        </label>
        <input
          id="shopName"
          type="text"
          autoFocus
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="Your shop name"
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
