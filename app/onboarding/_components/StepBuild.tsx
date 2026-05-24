'use client';

import { useEffect, useState } from 'react';
import type { OnboardingData } from './types';

interface StepBuildProps {
  data: OnboardingData;
  onBack: () => void;
}

const STEPS = [
  'Reading your mood and style preferences…',
  'Choosing your color palette and fonts…',
  'Assembling your storefront layout…',
  'Writing your opening copy…',
  'Putting the finishing touches on…',
];

export default function StepBuild({ data, onBack }: StepBuildProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (currentStep >= STEPS.length) {
      setDone(true);
      return;
    }
    const t = setTimeout(() => setCurrentStep((s) => s + 1), 1400);
    return () => clearTimeout(t);
  }, [currentStep]);

  return (
    <div className="space-y-8">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-1 text-sm text-muted hover:text-text-soft"
          disabled={!done}
        >
          ← Back
        </button>
        <h1 className="mb-2 font-serif text-3xl text-text">
          {done ? 'Your store is ready.' : `Building ${data.shopName || 'your store'}…`}
        </h1>
        <p className="text-sm text-muted">
          {done
            ? "Take a look — it's yours to customize from here."
            : 'This takes about 10 seconds.'}
        </p>
      </div>

      {!done ? (
        <div className="space-y-3">
          {STEPS.map((label, i) => {
            const isPast = i < currentStep;
            const isCurrent = i === currentStep;
            return (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={[
                    'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-[10px] transition-all duration-slow',
                    isPast ? 'border-honey bg-honey text-bg' : isCurrent ? 'border-honey-warm bg-transparent text-honey-warm' : 'border-white/10 bg-transparent text-transparent',
                  ].join(' ')}
                >
                  {isPast ? '✓' : isCurrent ? '·' : ''}
                </div>
                <span
                  className={[
                    'text-sm transition-colors duration-slow',
                    isPast ? 'text-text-soft' : isCurrent ? 'text-text' : 'text-muted',
                  ].join(' ')}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-honey/20 bg-honey/5 p-6 text-center space-y-4">
          <p className="text-4xl">✦</p>
          <p className="font-medium text-text">{data.shopName}</p>
          <p className="text-sm text-muted">AI generation coming in Layer 3.</p>
          <a
            href={`https://app.bohdiai.com`}
            className="inline-block rounded-lg bg-honey px-6 py-3 font-medium text-bg transition-opacity hover:opacity-90"
          >
            Go to your dashboard
          </a>
        </div>
      )}
    </div>
  );
}
