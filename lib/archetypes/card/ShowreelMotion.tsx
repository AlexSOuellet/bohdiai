'use client';

/**
 * Show reel — the motion. Arms the page (adds `.sr-armed`, which sets up the
 * entrances) only when motion is allowed, marks each screen `.sr-on` as it
 * scrolls into view, and drops the slammed letters' animation once they land
 * (so they stop being separate layers). Without this script the page simply
 * shows, at rest. (No piece counter: Alex, 2026-10-05.)
 */
import { useEffect } from 'react';

export function ShowreelMotion({ rootId }: { rootId: string }): null {

  useEffect(() => {
    const root = document.getElementById(rootId);
    if (root === null) return undefined;
    // No motion support (or reduced motion asked for): leave the page at rest.
    if (typeof window.matchMedia !== 'function' || typeof IntersectionObserver !== 'function') return undefined;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) root.classList.add('sr-armed');
    const slam = root.querySelector('.sr-slam');
    const letters = slam?.querySelectorAll('i');
    const last = letters?.[letters.length - 1];
    const landed = (): void => slam?.classList.add('sr-landed');
    last?.addEventListener('animationend', landed, { once: true });

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('sr-on');
        }
      },
      { threshold: 0.55 },
    );
    root.querySelectorAll('.sr-slide').forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      last?.removeEventListener('animationend', landed);
    };
  }, [rootId]);

  return null;
}
