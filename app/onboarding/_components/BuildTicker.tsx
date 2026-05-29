'use client';

import { useEffect, useState } from 'react';

interface BuildTickerProps {
  /** The latest maker-facing status line from Bohdi (or the legacy pipeline). */
  statusLabel: string;
  /** The current rotating tip, swapped every few seconds by the server. */
  tip: string;
  /** Elapsed time in seconds. */
  elapsed: number;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Cross-fades children when the `keyValue` prop changes. Lets status and tip
// swap smoothly instead of replacing in place.
function Crossfade({ keyValue, children }: { keyValue: string; children: React.ReactNode }) {
  const [shown, setShown] = useState(children);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    setOpacity(0);
    const t = setTimeout(() => {
      setShown(children);
      setOpacity(1);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyValue]);

  return (
    <div style={{ opacity, transition: 'opacity 300ms ease' }}>{shown}</div>
  );
}

export default function BuildTicker({ statusLabel, tip, elapsed }: BuildTickerProps) {
  return (
    <div className="space-y-12">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Composing your store</p>
        <Crossfade keyValue={statusLabel}>
          <p className="font-serif text-2xl text-text">{statusLabel}</p>
        </Crossfade>
      </div>

      <div className="border-t border-white/10 pt-8">
        <Crossfade keyValue={tip}>
          <p className="font-serif text-lg italic leading-relaxed text-text-soft">{tip}</p>
        </Crossfade>
      </div>

      <div className="flex items-center gap-2 pt-4 text-xs text-muted">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-honey-warm" />
        <span className="font-mono tabular-nums">{formatElapsed(elapsed)}</span>
      </div>
    </div>
  );
}
