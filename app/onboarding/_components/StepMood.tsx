'use client';

import { useState } from 'react';
import { MOOD_LIST } from '@/lib/moods';
import type { MoodKey } from '@/lib/moods';
import type { OnboardingData } from './types';

interface MoodVisual {
  background: string;
  border: string;
  text: string;
  label: string;
}

const MOOD_VISUALS: Record<MoodKey, MoodVisual> = {
  dark: {
    background: 'linear-gradient(135deg, #12090a 0%, #1e0d08 100%)',
    border: '#3d1808',
    text: '#f0e0c8',
    label: '#c9831e',
  },
  rustic: {
    background: 'linear-gradient(135deg, #2d1f0e 0%, #1e1409 100%)',
    border: '#4a3018',
    text: '#f5e8d0',
    label: '#a07848',
  },
  cozy: {
    background: 'linear-gradient(135deg, #2e1509 0%, #1e0e05 100%)',
    border: '#5c2810',
    text: '#faf0e0',
    label: '#e87038',
  },
  modern: {
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    border: '#3a3a3a',
    text: '#f4f4f4',
    label: '#e84a3c',
  },
  elegant: {
    background: 'linear-gradient(135deg, #16131c 0%, #0e0c14 100%)',
    border: '#2e2740',
    text: '#ece7f3',
    label: '#b9a6d6',
  },
  playful: {
    background: 'linear-gradient(135deg, #15123a 0%, #2a0f33 100%)',
    border: '#4a2a6a',
    text: '#fdeef6',
    label: '#ff7ac0',
  },
  industrial: {
    background: 'linear-gradient(135deg, #14171a 0%, #0c0e10 100%)',
    border: '#333b40',
    text: '#dfe6ea',
    label: '#7f96a3',
  },
};

interface StepMoodProps {
  data: OnboardingData;
  onAdvance: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export default function StepMood({ data, onAdvance, onBack }: StepMoodProps) {
  const [selectedMood, setSelectedMood] = useState<MoodKey | ''>(data.moodKey);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMood) return;
    onAdvance({ moodKey: selectedMood });
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
        <h1 className="mb-2 font-serif text-3xl text-text">How do you want your store to feel?</h1>
        <p className="text-sm text-muted">This shapes everything — colors, layout, the whole vibe.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {MOOD_LIST.map((mood) => {
          const visual = MOOD_VISUALS[mood.key];
          const isSelected = selectedMood === mood.key;
          return (
            <button
              key={mood.key}
              type="button"
              onClick={() => setSelectedMood(mood.key)}
              className={[
                'relative overflow-hidden rounded-lg border p-4 text-left transition-all duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-honey',
                isSelected ? 'ring-1 ring-honey/25' : '',
              ].join(' ')}
              style={{
                background: visual.background,
                borderColor: isSelected ? 'var(--honey)' : visual.border,
              }}
            >
              {isSelected && (
                <span
                  className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-honey text-[10px] text-bg"
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}
              <span
                className="mb-1 block text-xs font-medium uppercase tracking-widest opacity-70"
                style={{ color: visual.label }}
              >
                {mood.label}
              </span>
              <span className="block text-[11px] leading-relaxed opacity-80" style={{ color: visual.text }}>
                {mood.description.slice(0, 60)}…
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="submit"
        disabled={!selectedMood}
        className="w-full rounded-lg bg-honey px-6 py-3 font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Continue
      </button>
    </form>
  );
}
