'use client';

import { useEffect, useRef, useState } from 'react';
import { checkSubdomainAvailable } from '../actions';
import type { NicheOption, OnboardingData } from './types';
import { suggestShopName, toSubdomain } from './types';

const NICHE_EMOJI: Record<string, string> = {
  candles: '🕯️',
};

type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

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
  const [status, setStatus] = useState<AvailabilityStatus>(data.subdomain ? 'available' : 'idle');
  const [confirmedSubdomain, setConfirmedSubdomain] = useState(data.subdomain);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedNiche = niches.find((n) => n.slug === selectedSlug);
  const previewSubdomain = toSubdomain(shopName);
  const canContinue =
    selectedSlug !== '' &&
    selectedSlug !== 'other' &&
    shopName.trim() !== '' &&
    status === 'available';

  useEffect(() => {
    const trimmed = shopName.trim();
    if (!trimmed) {
      setStatus('idle');
      setConfirmedSubdomain('');
      return;
    }

    setStatus('checking');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await checkSubdomainAvailable(trimmed);
        setConfirmedSubdomain(result.available ? result.subdomain : '');
        setStatus(result.available ? 'available' : (result.subdomain.length < 2 ? 'idle' : 'taken'));
      } catch {
        setStatus('error');
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [shopName]);

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
    setStatus('idle');
    setConfirmedSubdomain('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canContinue) return;
    onAdvance({
      nicheSlug: selectedSlug,
      nicheDisplayName: selectedNiche?.display_name ?? 'Other',
      shopName: shopName.trim(),
      subdomain: confirmedSubdomain,
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
        <div className="space-y-3">
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

          {previewSubdomain !== '' && (
            <div className="flex items-center gap-2 text-xs">
              {status === 'checking' && (
                <span className="text-muted">Checking {previewSubdomain}.bohdiai.com…</span>
              )}
              {status === 'available' && (
                <>
                  <span className="text-honey">✓</span>
                  <span className="text-text-soft">
                    <span className="font-medium text-honey">{previewSubdomain}.bohdiai.com</span>{' '}
                    is available
                  </span>
                </>
              )}
              {status === 'taken' && (
                <>
                  <span className="text-red-400">✗</span>
                  <span className="text-red-400">
                    {previewSubdomain}.bohdiai.com is already taken — try a different name
                  </span>
                </>
              )}
              {status === 'error' && (
                <span className="text-muted">Couldn't check availability — try again</span>
              )}
            </div>
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
