'use client';

import { useState } from 'react';
import type { NicheOption, OnboardingData } from './types';
import { suggestShopName, toSubdomain } from './types';

const NICHE_EMOJI: Record<string, string> = {
  candles: '🕯️',
};

interface StepNicheProps {
  data: OnboardingData;
  niches: NicheOption[];
  onAdvance: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export default function StepNiche({ data, niches, onAdvance, onBack }: StepNicheProps) {
  const [selectedSlug, setSelectedSlug] = useState(data.nicheSlug);
  const [shopName, setShopName] = useState(data.shopName);
  const [showOther, setShowOther] = useState(data.nicheSlug === 'other');

  const selectedNiche = niches.find((n) => n.slug === selectedSlug);
  const subdomain = toSubdomain(shopName);
  const canContinue =
    (selectedSlug !== '' && selectedSlug !== 'other' && shopName.trim() !== '') ||
    (showOther && shopName.trim() !== '');

  function handleNicheSelect(slug: string, displayName: string) {
    setSelectedSlug(slug);
    setShowOther(false);
    if (shopName === '' || shopName === suggestShopName(data.name, selectedNiche?.display_name ?? '')) {
      setShopName(suggestShopName(data.name, displayName));
    }
  }

  function handleOtherSelect() {
    setSelectedSlug('other');
    setShowOther(true);
    setShopName('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canContinue) return;
    onAdvance({
      nicheSlug: selectedSlug,
      nicheDisplayName: selectedNiche?.display_name ?? 'Other',
      shopName: shopName.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-1 text-sm text-muted hover:text-text-soft"
        >
          ← Back
        </button>
        <h1 className="mb-2 font-serif text-3xl text-text">What do you make or sell?</h1>
        <p className="text-sm text-muted">Pick the closest match. You can refine later.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {niches.map((niche) => {
          const emoji = NICHE_EMOJI[niche.slug] ?? '🏪';
          const isSelected = selectedSlug === niche.slug;
          return (
            <button
              key={niche.slug}
              type="button"
              onClick={() => handleNicheSelect(niche.slug, niche.display_name)}
              className={[
                'flex flex-col items-start rounded-lg border p-4 text-left transition-all duration-fast',
                isSelected
                  ? 'border-honey bg-honey/10 text-text'
                  : 'border-white/10 bg-bg-2 text-text-soft hover:border-white/20 hover:text-text',
              ].join(' ')}
            >
              <span className="mb-2 text-2xl">{emoji}</span>
              <span className="font-medium">{niche.display_name}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={handleOtherSelect}
          className={[
            'flex flex-col items-start rounded-lg border p-4 text-left transition-all duration-fast',
            showOther
              ? 'border-honey bg-honey/10 text-text'
              : 'border-white/10 bg-bg-2 text-text-soft hover:border-white/20 hover:text-text',
          ].join(' ')}
        >
          <span className="mb-2 text-2xl">✦</span>
          <span className="font-medium">Something else</span>
        </button>
      </div>

      {(selectedSlug !== '' && !showOther) || showOther ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="shopName" className="mb-1.5 block text-sm font-medium text-text-soft">
              What would you like to call your shop?
            </label>
            <input
              id="shopName"
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Your shop name"
              className="w-full rounded-lg border border-white/10 bg-bg-2 px-4 py-3 text-text placeholder:text-muted focus:border-honey/60 focus:outline-none focus:ring-1 focus:ring-honey/40"
            />
          </div>

          {subdomain !== '' && (
            <p className="text-xs text-muted">
              Your store will live at{' '}
              <span className="font-medium text-honey">{subdomain}.bohdiai.com</span>
            </p>
          )}
        </div>
      ) : null}

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
