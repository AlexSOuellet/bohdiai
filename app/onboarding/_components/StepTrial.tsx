'use client';

import type { OnboardingData } from './types';

interface StepTrialProps {
  data: OnboardingData;
  onAdvance: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export default function StepTrial({ data, onAdvance, onBack }: StepTrialProps) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onAdvance({});
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
        <h1 className="mb-2 font-serif text-3xl text-text">Start your free trial</h1>
        <p className="text-sm text-muted">
          7 days free, then $35/mo. Cancel any time. No cut of your sales — ever.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-bg-2 p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-text">{data.shopName || 'Your shop'}</p>
            <p className="text-sm text-muted capitalize">{data.nicheDisplayName || 'Maker store'}</p>
          </div>
          <span className="rounded-full bg-honey/10 px-3 py-1 text-xs font-medium text-honey">
            14-day trial
          </span>
        </div>

        <div className="border-t border-white/10 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Monthly after trial</span>
            <span className="text-text">$35 / mo</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Transaction fees</span>
            <span className="text-text">None — ever</span>
          </div>
        </div>

        <p className="text-xs text-muted">
          Billing coming soon — click Continue to build your store preview.
        </p>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-honey px-6 py-3 font-medium text-bg transition-opacity hover:opacity-90"
      >
        Start free trial
      </button>
    </form>
  );
}
