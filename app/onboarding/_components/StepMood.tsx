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
  'dark-and-stormy': {
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
  'warm-and-cozy': {
    background: 'linear-gradient(135deg, #2e1509 0%, #1e0e05 100%)',
    border: '#5c2810',
    text: '#faf0e0',
    label: '#e87038',
  },
  'summer-afternoon': {
    background: 'linear-gradient(135deg, #fffbf0 0%, #fff8e4 100%)',
    border: '#e8d870',
    text: '#1a1808',
    label: '#9a8010',
  },
  'wild-meadow': {
    background: 'linear-gradient(135deg, #0a1e10 0%, #061408 100%)',
    border: '#1a3820',
    text: '#d0f0d8',
    label: '#4a9c5c',
  },
  'bright-bazaar': {
    background: 'linear-gradient(135deg, #1a0828 0%, #28082a 100%)',
    border: '#5a1878',
    text: '#f8e0f8',
    label: '#d850c8',
  },
  'sunday-morning': {
    background: 'linear-gradient(135deg, #f8f8f5 0%, #f0f0ea 100%)',
    border: '#d0d0c8',
    text: '#1a1a18',
    label: '#6a6a60',
  },
};

interface StepMoodProps {
  data: OnboardingData;
  onAdvance: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export default function StepMood({ data, onAdvance, onBack }: StepMoodProps) {
  const [selectedMood, setSelectedMood] = useState<MoodKey | ''>(data.moodKey);
  const [urls, setUrls] = useState<readonly [string, string, string]>(data.inspirationUrls);

  function setUrl(index: 0 | 1 | 2, value: string) {
    const next: [string, string, string] = [urls[0], urls[1], urls[2]];
    next[index] = value;
    setUrls(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMood) return;
    onAdvance({ moodKey: selectedMood, inspirationUrls: urls });
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
              className="relative overflow-hidden rounded-lg border p-4 text-left transition-all duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-honey"
              style={{
                background: visual.background,
                borderColor: isSelected ? '#e9a13d' : visual.border,
                boxShadow: isSelected ? '0 0 0 2px #e9a13d40' : 'none',
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

      {selectedMood !== '' && (
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-sm font-medium text-text-soft">
              Any sites you love or want yours to feel like?{' '}
              <span className="font-normal text-muted">Optional.</span>
            </p>
            <p className="mb-3 text-xs text-muted">Paste up to three. Skip this if you're not sure.</p>
          </div>
          {([0, 1, 2] as const).map((i) => (
            <input
              key={i}
              type="url"
              value={urls[i]}
              onChange={(e) => setUrl(i, e.target.value)}
              placeholder={`https://example.com${i > 0 ? ` (${i + 1})` : ''}`}
              className="w-full rounded-lg border border-white/10 bg-bg-2 px-4 py-2.5 text-sm text-text placeholder:text-muted focus:border-honey/60 focus:outline-none focus:ring-1 focus:ring-honey/40"
            />
          ))}
        </div>
      )}

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
