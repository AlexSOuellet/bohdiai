'use client';

/**
 * A work-wall clip that stays still until asked: poster frame + play mark,
 * plays on hover/focus (desktop) and toggles on tap (touch). Only the hero
 * video autoplays on the page — a wall of simultaneous clips is noise.
 */
import { useRef, useState } from 'react';
import type { ContractorMedia } from './schemas';
import { CONTRACTOR_STRINGS as S } from './strings';

export function VideoTile({ media }: { media: ContractorMedia }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function play(): void {
    const v = ref.current;
    if (v === null) return;
    v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }
  function stop(): void {
    const v = ref.current;
    if (v === null) return;
    v.pause();
    setPlaying(false);
  }

  return (
    <button
      type="button"
      className="cp-vtile"
      data-playing={playing ? 'true' : 'false'}
      aria-label={`${playing ? S.pauseVideo : S.playVideo}: ${media.alt}`}
      aria-pressed={playing}
      onMouseEnter={play}
      onMouseLeave={stop}
      onFocus={play}
      onBlur={stop}
      onClick={() => (playing ? stop() : play())}
    >
      <video ref={ref} src={media.url} poster={media.poster} muted loop playsInline preload="none" aria-hidden="true" />
      <span className="cp-vtile__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
      </span>
    </button>
  );
}
