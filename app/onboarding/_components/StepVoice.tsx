'use client';

import { useState } from 'react';
import type { OnboardingData } from './types';

interface StepVoiceProps {
  data: OnboardingData;
  onAdvance: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export default function StepVoice({ data, onAdvance, onBack }: StepVoiceProps) {
  const [boothPitch, setBoothPitch] = useState(data.voiceBoothPitch);
  const [negativeSpace, setNegativeSpace] = useState(data.voiceNegativeSpace);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onAdvance({
      voiceBoothPitch: boothPitch.trim(),
      voiceNegativeSpace: negativeSpace.trim(),
    });
  }

  const firstName = data.makerName.trim();
  const opener = firstName !== '' ? `${firstName}, ` : '';

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
          {opener}tell me about your work in your own words.
        </h1>
        <p className="text-sm text-muted">
          Both are optional — skip if you'd rather. What you write here goes straight into your about page in your voice, not ours.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="boothPitch" className="mb-2 block text-sm text-text-soft">
            If someone walked up to your booth at a craft fair, what would you tell them?
          </label>
          <textarea
            id="boothPitch"
            value={boothPitch}
            onChange={(e) => setBoothPitch(e.target.value)}
            placeholder="A few sentences — how you'd say it out loud."
            rows={4}
            maxLength={600}
            className="w-full resize-none rounded-lg border border-white/10 bg-bg-2 px-4 py-3 text-base text-text placeholder:text-muted focus:border-honey/60 focus:outline-none focus:ring-1 focus:ring-honey/40"
          />
        </div>

        <div>
          <label htmlFor="negativeSpace" className="mb-2 block text-sm text-text-soft">
            Anything you don't want your site to feel like?
          </label>
          <textarea
            id="negativeSpace"
            value={negativeSpace}
            onChange={(e) => setNegativeSpace(e.target.value)}
            placeholder="A site you've seen and didn't like, or just a vibe to avoid."
            rows={3}
            maxLength={400}
            className="w-full resize-none rounded-lg border border-white/10 bg-bg-2 px-4 py-3 text-base text-text placeholder:text-muted focus:border-honey/60 focus:outline-none focus:ring-1 focus:ring-honey/40"
          />
        </div>
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
