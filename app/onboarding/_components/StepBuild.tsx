'use client';

import { useEffect, useRef, useState } from 'react';
import { MOODS, type MoodKey } from '@/lib/moods';
import type { OnboardingData } from './types';
import type { ProgressEvent } from '@/lib/progress';
import BuildTicker from './BuildTicker';

function isMoodKey(value: string): value is MoodKey {
  return value in MOODS;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface StepBuildProps {
  data: OnboardingData;
  onBack: () => void;
}

export default function StepBuild({ data, onBack }: StepBuildProps) {
  const [statusLabel, setStatusLabel] = useState('Getting set up…');
  const [tip, setTip] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [tenantSubdomain, setTenantSubdomain] = useState('');
  const [buildSeconds, setBuildSeconds] = useState(0);
  const calledRef = useRef(false);

  // Real elapsed-time counter.
  useEffect(() => {
    if (done) return;
    const startedAt = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [done]);

  // Stream generation events from the SSE route.
  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    if (!data.moodKey || !isMoodKey(data.moodKey)) {
      setError('Something went wrong — please go back and reselect your mood.');
      setDone(true);
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/onboarding/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopName: data.shopName,
            subdomain: data.subdomain,
            nicheSlug: data.nicheSlug,
            moodKey: data.moodKey,
            productCount: data.productCount,
            makerName: data.makerName === '' ? undefined : data.makerName,
            logoUrl: data.logoUrl === '' ? undefined : data.logoUrl,
            brandColors: data.brandColors.length === 0 ? undefined : data.brandColors,
            voiceBoothPitch: data.voiceBoothPitch === '' ? undefined : data.voiceBoothPitch,
            voiceNegativeSpace: data.voiceNegativeSpace === '' ? undefined : data.voiceNegativeSpace,
          }),
        });

        if (!res.ok || !res.body) {
          setError('We hit a problem starting your build. Go back and try again.');
          setDone(true);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // Parse the SSE stream. Each event is `data: <json>\n\n`. We split on
        // double-newline to find complete events; partial events stay in the
        // buffer for the next chunk.
        while (true) {
          const { value, done: streamDone } = await reader.read();
          if (streamDone) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';
          for (const evt of events) {
            const line = evt.split('\n').find((l) => l.startsWith('data: '));
            if (line === undefined) continue;
            const json = line.slice('data: '.length);
            try {
              const parsed = JSON.parse(json) as ProgressEvent;
              handleEvent(parsed);
            } catch {
              // Skip malformed events — log silently.
            }
          }
        }
      } catch {
        setError('We hit a problem building your store. Go back and try again — your choices are saved.');
        setDone(true);
      }
    })();

    // No cleanup — once generation starts we let it run to completion even if
    // the component remounts (React Strict Mode does this in dev). The server
    // keeps building; the maker sees the result on next visit.

    function handleEvent(evt: ProgressEvent) {
      if (evt.type === 'status') {
        setStatusLabel(evt.label);
      } else if (evt.type === 'tip') {
        setTip(evt.text);
      } else if (evt.type === 'done') {
        setTenantSubdomain(evt.subdomain);
        setBuildSeconds(Math.round(evt.totalMs / 1000));
        setDone(true);
      } else if (evt.type === 'error') {
        setError(evt.message);
        setDone(true);
      }
    }

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
          {done
            ? error
              ? 'Something went wrong.'
              : 'Your store is ready.'
            : `Building ${data.shopName || 'your store'}…`}
        </h1>
        <p className="text-sm text-muted">
          {done
            ? error
              ? 'You can go back and try again.'
              : `Built in ${formatElapsed(buildSeconds)}. Take a look — it's yours to customize from here.`
            : 'A few minutes. Worth it.'}
        </p>
      </div>

      {!done ? (
        <BuildTicker statusLabel={statusLabel} tip={tip} elapsed={elapsed} />
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
