'use client';

import { useEffect, useRef, useState } from 'react';
import { checkSubdomainAvailable } from '../actions';
import type { NicheOption, OnboardingData } from './types';
import { toSubdomain } from './types';

type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

// Must match OTHER_NICHE_SLUG in lib/onboarding/build-archetype-store — the
// sentinel for a maker who describes their own craft instead of picking one.
const OTHER = 'other';
const OTHER_LABEL = 'Other — something else';

/** Whether the niche step can advance. Pure so it can be tested without driving
 *  the subdomain-availability debounce. "Other" additionally requires a typed
 *  description; a list pick does not. */
export function nicheStepCanContinue(args: {
  selectedSlug: string;
  nicheDescription: string;
  shopName: string;
  status: AvailabilityStatus;
}): boolean {
  const isOther = args.selectedSlug === OTHER;
  const descriptionOk = !isOther || args.nicheDescription.trim() !== '';
  return (
    args.selectedSlug !== '' &&
    descriptionOk &&
    args.shopName.trim() !== '' &&
    args.status === 'available'
  );
}

interface StepNicheProps {
  data: OnboardingData;
  niches: NicheOption[];
  onAdvance: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export default function StepNiche({ data, niches, onAdvance, onBack }: StepNicheProps) {
  const [selectedSlug, setSelectedSlug] = useState(data.nicheSlug);
  const [nicheDescription, setNicheDescription] = useState(data.nicheDescription);
  const [shopName, setShopName] = useState(data.shopName);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<AvailabilityStatus>(data.subdomain ? 'available' : 'idle');
  const [confirmedSubdomain, setConfirmedSubdomain] = useState(data.subdomain);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isOther = selectedSlug === OTHER;
  const selectedNiche = niches.find((n) => n.slug === selectedSlug);
  const selectedLabel = isOther ? OTHER_LABEL : selectedNiche?.display_name;
  const previewSubdomain = toSubdomain(shopName);

  const filtered = query.trim()
    ? niches.filter((n) => n.display_name.toLowerCase().includes(query.toLowerCase()))
    : niches;

  const canContinue = nicheStepCanContinue({ selectedSlug, nicheDescription, shopName, status });

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
    // Intentional: this effect derives availability status from the typed shop
    // name. Seeding/resetting status synchronously gives immediate feedback —
    // it is not the sync-props-to-state pattern the rule guards against.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!trimmed) {
      setStatus('idle');
      setConfirmedSubdomain('');
      return;
    }

    setStatus('checking');
    /* eslint-enable react-hooks/set-state-in-effect */

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
      nicheDisplayName: isOther ? '' : (selectedNiche?.display_name ?? ''),
      nicheDescription: isOther ? nicheDescription.trim() : '',
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
          <span className={selectedLabel ? 'text-text' : 'text-muted'}>
            {selectedLabel ?? 'Select your niche…'}
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
              {filtered.map((niche) => (
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
              ))}
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-muted">
                  No matches — or describe your own below.
                </li>
              )}
              {/* "Other" is always offered, even while filtering — the maker can
                  always describe what they make instead of picking from the list. */}
              <li className="border-t border-white/10">
                <button
                  type="button"
                  onClick={() => selectNiche(OTHER)}
                  className={[
                    'w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/5',
                    isOther ? 'text-honey' : 'text-text-soft',
                  ].join(' ')}
                >
                  {OTHER_LABEL}
                  {isOther && <span className="float-right">✓</span>}
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* "Other" — the maker tells us what they make, in their own words. */}
      {isOther && (
        <div>
          <label htmlFor="nicheDescription" className="mb-1.5 block text-sm font-medium text-text-soft">
            Tell us what you make
          </label>
          <textarea
            id="nicheDescription"
            value={nicheDescription}
            onChange={(e) => setNicheDescription(e.target.value)}
            rows={3}
            placeholder="A sentence or two is plenty — e.g. hand-poured concrete planters with pressed botanicals."
            className="w-full resize-none rounded-lg border border-white/10 bg-bg-2 px-4 py-3 text-text placeholder:text-muted focus:border-honey/60 focus:outline-none focus:ring-1 focus:ring-honey/40"
          />
        </div>
      )}

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
                <span className="text-muted">Couldn&apos;t check availability — try again</span>
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
