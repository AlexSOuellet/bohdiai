'use client';

import { useEffect, useRef } from 'react';

/**
 * Continuously spawns rising ember spans inside the .scene-embers container.
 * Matches the mock's behavior: 2-3 large embers visible at any time, each
 * with a random horizontal start, size, duration, and drift.
 */
export function Embers(): React.ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    function spawn(): void {
      if (!container) return;
      const e = document.createElement('span');
      e.className = 'ember';
      const left = Math.random() * 100;
      const size = 2 + Math.random() * 4;
      const duration = 6 + Math.random() * 7;
      const drift = (Math.random() - 0.5) * 80;
      e.style.left = `${left}%`;
      e.style.width = `${size}px`;
      e.style.height = `${size}px`;
      e.style.animationDuration = `${duration}s`;
      e.style.setProperty('--drift', `${drift}px`);
      container.appendChild(e);
      const t = setTimeout(() => e.remove(), duration * 1000 + 100);
      timeouts.push(t);
    }

    spawn();
    timeouts.push(setTimeout(spawn, 4000));
    timeouts.push(setTimeout(spawn, 9000));
    const interval = setInterval(spawn, 6500);

    return () => {
      clearInterval(interval);
      for (const t of timeouts) clearTimeout(t);
      if (container) container.innerHTML = '';
    };
  }, []);

  return <div ref={containerRef} className="scene-embers" aria-hidden="true" />;
}
