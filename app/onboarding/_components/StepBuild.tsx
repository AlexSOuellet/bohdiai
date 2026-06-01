'use client';

import { useEffect, useRef, useState } from 'react';
import { MOODS, type MoodKey } from '@/lib/moods';
import type { OnboardingData } from './types';
import BuildTicker from './BuildTicker';

const POLL_MS = 2500;

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
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [tenantSubdomain, setTenantSubdomain] = useState('');
  const [buildSeconds, setBuildSeconds] = useState(0);
  const calledRef = useRef(false);
  const startRef = useRef(0);

  // Real elapsed-time counter.
  useEffect(() => {
    if (done) return;
    const startedAt = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [done]);

  // Kick off a background build, then poll it for progress and the result. The
  // build runs on its own — even if this screen reloads, the build keeps going
  // and the maker sees the result when they return.
  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    if (!data.moodKey || !isMoodKey(data.moodKey)) {
      // Intentional one-time guard (runs at most once via calledRef): an invalid
      // mood can't be built, so we surface the error through state immediately.
      /* eslint-disable react-hooks/set-state-in-effect */
      setError('Something went wrong — please go back and reselect your mood.');
      setDone(true);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }

    startRef.current = Date.now();
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = (subdomain: string) => {
      setTenantSubdomain(subdomain);
      setBuildSeconds(Math.round((Date.now() - startRef.current) / 1000));
      setDone(true);
    };
    const fail = (message: string) => {
      setError(message);
      setDone(true);
    };

    const poll = (buildId: string) => {
      const tick = async () => {
        if (cancelled) return;
        try {
          const r = await fetch(`/api/onboarding/builds/${buildId}`);
          if (r.ok) {
            const b = (await r.json()) as {
              status: 'pending' | 'running' | 'done' | 'failed';
              statusLabel: string | null;
              subdomain: string;
              error: string | null;
            };
            if (b.statusLabel) setStatusLabel(b.statusLabel);
            if (b.status === 'done') return finish(b.subdomain);
            if (b.status === 'failed')
              return fail(b.error ?? 'Something went wrong. Go back and try again.');
          }
        } catch {
          // transient — keep polling
        }
        pollTimer = setTimeout(() => void tick(), POLL_MS);
      };
      void tick();
    };

    (async () => {
      try {
        const res = await fetch('/api/onboarding/start', {
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
          }),
        });
        if (!res.ok) {
          fail('We hit a problem starting your build. Go back and try again.');
          return;
        }
        const { buildId } = (await res.json()) as { buildId: string };
        poll(buildId);
      } catch {
        fail('We hit a problem starting your build. Go back and try again.');
      }
    })();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
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
        <BuildTicker statusLabel={statusLabel} tip="" elapsed={elapsed} />
      ) : error ? (
        <div className="space-y-3 rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-honey/20 bg-honey/5 p-6 text-center">
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
            <a href="https://app.bohdiai.com" className="text-sm text-muted hover:text-text-soft">
              Go to your dashboard →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
