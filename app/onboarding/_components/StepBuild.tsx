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

/** The storefront's URL, correct for the environment we're in. In dev the
 *  tenant resolves at `{sub}.localhost:{port}`; in production at the real domain. */
function storefrontUrl(subdomain: string): string {
  if (typeof window === 'undefined') return `https://${subdomain}.bohdiai.com`;
  const { hostname, port, protocol } = window.location;
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return `${protocol}//${subdomain}.localhost${port ? `:${port}` : ''}`;
  }
  return `https://${subdomain}.bohdiai.com`;
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
  const startedRef = useRef(false);
  const cancelledRef = useRef(false);
  const buildIdRef = useRef<string | null>(null);
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
  //
  // Cancellation lives in a REF, reset by whichever mount is live, so React's
  // dev StrictMode double-mount (mount → cleanup → mount) can't permanently kill
  // the poll: the throwaway mount's cleanup flips the ref, the live mount flips
  // it back. The POST fires exactly once (startedRef); the live mount resumes
  // polling from the stored build id.
  useEffect(() => {
    cancelledRef.current = false;

    const finish = (subdomain: string) => {
      setTenantSubdomain(subdomain);
      setBuildSeconds(Math.round((Date.now() - startRef.current) / 1000));
      setDone(true);
    };
    const fail = (message: string) => {
      setError(message);
      setDone(true);
    };

    const tick = async () => {
      const buildId = buildIdRef.current;
      if (cancelledRef.current || buildId === null) return;
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
          if (b.status === 'failed') return fail(b.error ?? 'Something went wrong. Go back and try again.');
        }
      } catch {
        // transient — keep polling
      }
      if (!cancelledRef.current) setTimeout(() => void tick(), POLL_MS);
    };

    if (startedRef.current) {
      // Remount (e.g. StrictMode): the build is already running — just resume polling.
      void tick();
      return () => {
        cancelledRef.current = true;
      };
    }
    startedRef.current = true;

    if (!data.moodKey || !isMoodKey(data.moodKey)) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setError('Something went wrong — please go back and reselect your mood.');
      setDone(true);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }

    startRef.current = Date.now();

    void (async () => {
      try {
        const res = await fetch('/api/onboarding/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopName: data.shopName,
            subdomain: data.subdomain,
            nicheSlug: data.nicheSlug,
            nicheDescription: data.nicheDescription === '' ? undefined : data.nicheDescription,
            moodKey: data.moodKey,
            productCount: data.productCount,
            makerName: data.makerName === '' ? undefined : data.makerName,
            logoUrl: data.logoUrl === '' ? undefined : data.logoUrl,
            brandColors: data.brandColors.length === 0 ? undefined : data.brandColors,
            productPhotoUrls: data.productPhotoUrls.length === 0 ? undefined : data.productPhotoUrls,
            visionPerPhoto: data.visionPerPhoto.length === 0 ? undefined : data.visionPerPhoto,
            makerWork: data.makerWork === '' ? undefined : data.makerWork,
          }),
        });
        if (!res.ok) {
          fail('We hit a problem starting your build. Go back and try again.');
          return;
        }
        const { buildId } = (await res.json()) as { buildId: string };
        buildIdRef.current = buildId;
        void tick();
      } catch {
        fail('We hit a problem starting your build. Go back and try again.');
      }
    })();

    return () => {
      cancelledRef.current = true;
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
              href={storefrontUrl(tenantSubdomain)}
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
