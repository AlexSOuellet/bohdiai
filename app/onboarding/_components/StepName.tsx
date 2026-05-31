'use client';

import { useState } from 'react';
import type { OnboardingData } from './types';

interface StepNameProps {
  data: OnboardingData;
  onAdvance: (patch: Partial<OnboardingData>) => void;
}

export default function StepName({ data, onAdvance }: StepNameProps) {
  const [shopName, setShopName] = useState(data.shopName);
  const [makerName, setMakerName] = useState(data.makerName);
  const shopTrimmed = shopName.trim();
  const makerTrimmed = makerName.trim();
  const canContinue = shopTrimmed !== '' && makerTrimmed !== '';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canContinue) return;
    onAdvance({ shopName: shopTrimmed, makerName: makerTrimmed });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h1 className="mb-2 font-serif text-3xl text-text">First things first.</h1>
        <p className="text-sm text-muted">You can change either of these later.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor="shopName" className="mb-2 block text-sm text-text-soft">
            What&apos;s your shop called?
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

        <div>
          <label htmlFor="makerName" className="mb-2 block text-sm text-text-soft">
            And what&apos;s your name?
          </label>
          <input
            id="makerName"
            type="text"
            value={makerName}
            onChange={(e) => setMakerName(e.target.value)}
            placeholder="First name"
            className="w-full rounded-lg border border-white/10 bg-bg-2 px-4 py-3 text-lg text-text placeholder:text-muted focus:border-honey/60 focus:outline-none focus:ring-1 focus:ring-honey/40"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!canContinue}
        className="w-full rounded-lg bg-honey px-6 py-3 font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Continue
      </button>
    </form>
  );
}
