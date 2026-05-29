'use client';

import { useEffect, useRef, useState } from 'react';
import { generateStorefront } from '../actions';
import { MOODS, type MoodKey } from '@/lib/moods';
import type { OnboardingData } from './types';

function isMoodKey(value: string): value is MoodKey {
  return value in MOODS;
}

interface StepBuildProps {
  data: OnboardingData;
  onBack: () => void;
}

const ANIMATION_STEPS = [
  'Reading your mood and style preferences…',
  'Choosing your color palette and fonts…',
  'Assembling your storefront layout…',
  'Writing your opening copy…',
  'Putting the finishing touches on…',
];

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function StepBuild({ data, onBack }: StepBuildProps) {
  const [animStep, setAnimStep] = useState(0);
  const [animDone, setAnimDone] = useState(false);
  const [genDone, setGenDone] = useState(false);
  const [tenantSubdomain, setTenantSubdomain] = useState('');
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const calledRef = useRef(false);

  const done = animDone && genDone;

  // Real elapsed-time counter — ticks every second until generation finishes.
  useEffect(() => {
    if (genDone) return;
    const startedAt = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [genDone]);

  // Cosmetic progress animation
  useEffect(() => {
    if (animStep >= ANIMATION_STEPS.length) {
      setAnimDone(true);
      return;
    }
    const t = setTimeout(() => setAnimStep((s) => s + 1), 1400);
    return () => clearTimeout(t);
  }, [animStep]);

  // Real generation — fires once on mount
  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    if (!data.moodKey || !isMoodKey(data.moodKey)) {
      setError('Something went wrong — please go back and reselect your mood.');
      setGenDone(true);
      return;
    }

    generateStorefront({
      shopName: data.shopName,
      subdomain: data.subdomain,
      nicheSlug: data.nicheSlug,
      moodKey: data.moodKey,
      productCount: data.productCount,
    })
      .then((result) => {
        setTenantSubdomain(result.subdomain);
        setGenDone(true);
      })
      .catch(() => {
        setError('We hit a problem building your store. Go back and try again — your choices are saved.');
        setGenDone(true);
      });
  }, [data]);

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
          {done ? (error ? 'Something went wrong.' : 'Your store is ready.') : `Building ${data.shopName || 'your store'}…`}
        </h1>
        <p className="text-sm text-muted">
          {done ? (
            error ? 'You can go back and try again.' : "Take a look — it's yours to customize from here."
          ) : (
            <>
              Elapsed <span className="font-mono tabular-nums text-text-soft">{formatElapsed(elapsed)}</span>
            </>
          )}
        </p>
      </div>

      {!done ? (
        <div className="space-y-3">
          {ANIMATION_STEPS.map((label, i) => {
            const isPast = i < animStep;
            const isCurrent = i === animStep;
            return (
              <div key={label} className="flex items-center gap-3">
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
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 space-y-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-honey/20 bg-honey/5 p-6 text-center space-y-4">
          <p className="text-4xl">✦</p>
          <p className="font-medium text-text">{data.shopName}</p>
          <p className="text-xs text-muted">{tenantSubdomain}.bohdiai.com</p>
          <div className="flex flex-col gap-2">
            <a
              href={`https://${tenantSubdomain}.bohdiai.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg bg-honey px-6 py-3 font-medium text-bg transition-opacity hover:opacity-90"
            >
              See your storefront
            </a>
            <a
              href="https://app.bohdiai.com"
              className="text-sm text-muted hover:text-text-soft"
            >
              Go to your dashboard →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
