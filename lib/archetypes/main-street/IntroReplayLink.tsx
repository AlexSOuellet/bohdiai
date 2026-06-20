'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { REPLAY_INTRO_EVENT } from './moment-gate';

/**
 * The footer "Intro" link. A real <Link> (client-side nav, no full reload) to
 * `/?intro=1` — which covers arriving at home from another page (MomentHero
 * mounts fresh and reads the param) — plus a window event that covers the
 * already-on-home case (no remount happens, so MomentHero replays on the event).
 */
export function IntroReplayLink({
  children,
  style,
  className,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <Link
      href="/?intro=1"
      data-type="legal"
      {...(className ? { className } : {})}
      {...(style ? { style } : {})}
      onClick={() => {
        if (typeof window !== 'undefined') window.dispatchEvent(new Event(REPLAY_INTRO_EVENT));
      }}
    >
      {children}
    </Link>
  );
}
