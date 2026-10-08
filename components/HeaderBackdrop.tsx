'use client';

/**
 * The solid strip behind the sticky header. Hidden at the top of the page, where
 * the header sits on the hero; once the page scrolls it fades in, full width, so
 * content passing underneath doesn't mix with the header's pills.
 */
import { useEffect, useState } from 'react';

/** Scroll distance (px) before the strip shows. */
export const BACKDROP_AFTER = 8;

export function HeaderBackdrop(): React.ReactElement {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = (): void => setScrolled(window.scrollY > BACKDROP_AFTER);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <div
      aria-hidden="true"
      data-scrolled={scrolled}
      className="pointer-events-none absolute -bottom-2.5 -top-3 left-1/2 z-behind w-screen -translate-x-1/2 border-b border-white/[0.08] bg-bg opacity-0 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.9)] transition-opacity duration-base data-[scrolled=true]:opacity-100 md:-top-4"
    />
  );
}
