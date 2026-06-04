'use client';

import { useState } from 'react';
import type { OnboardingData } from './types';

// Approximate is enough — selection only needs the TIER, not an exact count.
// Each tier maps to a representative number the engine and Bohdi read.
interface CatalogTier {
  count: number;
  label: string;
  description: string;
}

const TIERS: CatalogTier[] = [
  { count: 6, label: 'A handful', description: 'Under ten things to sell' },
  { count: 20, label: 'A couple dozen', description: 'Roughly ten to thirty' },
  { count: 45, label: 'A big catalog', description: 'Thirty or more' },
];

function nearestTier(count: number): number {
  let best = TIERS[0]!.count;
  let bestGap = Math.abs(count - best);
  for (const t of TIERS) {
    const gap = Math.abs(count - t.count);
    if (gap < bestGap) {
      best = t.count;
      bestGap = gap;
    }
  }
  return best;
}

interface StepCatalogSizeProps {
  data: OnboardingData;
  onAdvance: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export default function StepCatalogSize({ data, onAdvance, onBack }: StepCatalogSizeProps) {
  const [selected, setSelected] = useState<number>(nearestTier(data.productCount));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onAdvance({ productCount: selected });
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
        <h1 className="mb-2 font-serif text-3xl text-text">
          Roughly how much do you sell?
        </h1>
        <p className="text-sm text-muted">
          A rough idea is plenty. It just helps us shape the right kind of store — you can add and
          change products anytime.
        </p>
      </div>

      <div className="grid gap-3">
        {TIERS.map((tier) => {
          const isSelected = selected === tier.count;
          return (
            <button
              key={tier.count}
              type="button"
              onClick={() => setSelected(tier.count)}
              className={[
                'relative flex items-baseline justify-between rounded-lg border px-5 py-4 text-left transition-all duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-honey',
                isSelected ? 'border-honey ring-1 ring-honey/25' : 'border-line hover:border-text-soft',
              ].join(' ')}
            >
              <span>
                <span className="block text-base font-medium text-text">{tier.label}</span>
                <span className="block text-xs text-muted">{tier.description}</span>
              </span>
              {isSelected && (
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-honey text-[10px] text-bg"
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-honey px-6 py-3 font-medium text-bg transition-opacity hover:opacity-90"
      >
        Continue
      </button>
    </form>
  );
}
