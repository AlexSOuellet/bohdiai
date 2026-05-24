'use client';

import { useEffect, useRef, useState } from 'react';
import { checkSubdomainAvailable } from '../actions';
import type { NicheOption, OnboardingData } from './types';
import { toSubdomain } from './types';

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
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<AvailabilityStatus>(data.subdomain ? 'available' : 'idle');
  const [confirmedSubdomain, setConfirmedSubdomain] = useState(data.subdomain);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedNiche = niches.find((n) => n.slug === selectedSlug);
  const previewSubdomain = toSubdomain(shopName);

  const filtered = query.trim()
    ? niches.filter((n) => n.display_name.toLowerCase().includes(query.toLowerCase()))
    : niches;

  const canContinue =
    selectedSlug !== '' &&
    shopName.trim() !== '' &&
    status === 'available';

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced subdomain availability check
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
        setStatus(result.available ? 'available' : result.subdomain.length < 2 ? 'idle' : 'taken');
      } catch {
        setStatus('error');
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [shopName]);

  function selectNiche(slug: string) {
    setSelectedSlug(slug);
    setOpen(false);
    setQuery('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canContinue) return;
    onAdvance({
      nicheSlug: selectedSlug,
      nicheDisplayName: selectedNiche?.display_name ?? '',
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

      {/* Niche dropdown */}
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={[
            'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
            open
              ? 'border-honey/60 bg-bg-2 ring-1 ring-honey/40'
              : selectedNiche
              ? 'border-honey/40 bg-bg-2 text-text'
              : 'border-white/10 bg-bg-2 text-muted',
          ].join(' ')}
        >
          <span className={selectedNiche ? 'text-text' : 'text-muted'}>
            {selectedNiche ? selectedNiche.display_name : 'Select your niche…'}
          </span>
          <span className="text-muted">{open ? '▲' : '▼'}</span>
        </button>

        {open && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-white/10 bg-bg-2 shadow-lg">
            <div className="border-b border-white/10 p-2">
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full rounded bg-bg px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none"
              />
            </div>
            <ul className="max-h-60 overflow-y-auto py-1">
              {filtered.length > 0 ? (
                filtered.map((niche) => (
                  <li key={niche.slug}>
                    <button
                      type="button"
                      onClick={() => selectNiche(niche.slug)}
                      className={[
                        'w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/5',
                        selectedSlug === niche.slug ? 'text-honey' : 'text-text-soft',
                      ].join(' ')}
                    >
                      {niche.display_name}
                      {selectedSlug === niche.slug && <span className="float-right">✓</span>}
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-4 py-3 text-sm text-muted">No matches — more niches coming soon.</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Shop name + subdomain check */}
      {selectedSlug !== '' && (
        <div className="space-y-3">
          <div>
            <label htmlFor="shopName" className="mb-1.5 block text-sm font-medium text-text-soft">
              Shop name
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
                    {previewSubdomain}.bohdiai.com is taken — try a different name
                  </span>
                </>
              )}
              {status === 'error' && (
                <span className="text-muted">Couldn't check availability — try again</span>
              )}
            </div>
          )}
        </div>
      )}

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
