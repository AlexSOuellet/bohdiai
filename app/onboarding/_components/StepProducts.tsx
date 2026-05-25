'use client';

import { PRODUCT_COUNT_OPTIONS, type OnboardingData } from './types';

interface StepProductsProps {
  data: OnboardingData;
  onNext: (updates: Partial<OnboardingData>) => void;
}

export function StepProducts({ data, onNext }: StepProductsProps) {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div>
        <h2
          className="mb-3 text-3xl font-semibold"
          style={{ fontFamily: 'var(--font-display, var(--font-sans))' }}
        >
          How many products do you have?
        </h2>
        <p className="text-muted-foreground max-w-sm text-base">
          {"We'll build out your store with the right amount. You can add real products right after."}
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        {PRODUCT_COUNT_OPTIONS.map((option) => {
          const selected = data.productCount === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onNext({ productCount: option.value })}
              className="flex items-center justify-between rounded-xl border px-6 py-4 text-left transition-all"
              style={{
                borderColor: selected ? 'var(--honey, #C49A22)' : 'var(--border, #e5e7eb)',
                backgroundColor: selected ? 'var(--honey-muted, #FDF6E3)' : 'transparent',
                fontWeight: selected ? 600 : 400,
              }}
            >
              <span>{option.label}</span>
              <span className="text-sm opacity-60">
                {option.value} placeholder products
              </span>
            </button>
          );
        })}
      </div>

      <p className="max-w-xs text-sm opacity-50">
        {"We'll generate realistic placeholder products and photos so your store looks fully stocked on day one."}
      </p>
    </div>
  );
}
