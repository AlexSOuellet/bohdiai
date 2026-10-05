'use client';

/**
 * Torch — the fire. Arms the page (`.tt-armed`, which hides what is about to
 * burn) only when motion is allowed, lights the opening at once, and lights
 * everything else (`.tt-lit`) as it scrolls in. Each burning word throws sparks
 * along its burn front, timed from its data-d / data-delay (the same table the
 * stylesheet's timing classes come from). Without this script the page simply
 * shows, every word already burned in.
 */
import { useEffect } from 'react';

function sparks(el: HTMLElement): void {
  const d = Number(el.dataset['d'] ?? '2') * 1000;
  const delay = Number(el.dataset['delay'] ?? '0') * 1000;
  window.setTimeout(() => {
    let start: number | null = null;
    const tick = (t: number): void => {
      start ??= t;
      const k = (t - start) / d;
      if (k > 1) return;
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      const count = Math.random() < 0.7 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const s = document.createElement('i');
        s.className = 'tt-spark';
        s.style.left = `${e * el.offsetWidth * 1.02}px`;
        s.style.top = `${Math.random() * el.offsetHeight}px`;
        el.appendChild(s);
        const dx = Math.random() * 60 - 10;
        const dy = -(20 + Math.random() * 70);
        s.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(.2)`, opacity: 0 }], {
          duration: 500 + Math.random() * 700,
          easing: 'cubic-bezier(.2,.7,.4,1)',
        }).onfinish = () => s.remove();
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, delay);
}

function light(el: Element): void {
  if (el.classList.contains('tt-lit')) return;
  el.classList.add('tt-lit');
  const burns = el.matches('[data-burn]') ? [el] : [...el.querySelectorAll('[data-burn]')];
  for (const b of burns) {
    b.classList.add('tt-lit');
    sparks(b as HTMLElement);
  }
}

export function TorchFire({ rootId }: { rootId: string }): null {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (root === null) return undefined;
    // No motion support (or reduced motion asked for): every word stays burned in, at rest.
    if (typeof window.matchMedia !== 'function' || typeof IntersectionObserver !== 'function') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    root.classList.add('tt-armed');
    root.querySelectorAll('.tt-open [data-burn]').forEach(light);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          light(e.target);
          io.unobserve(e.target);
        }
      },
      { threshold: 0.25 },
    );
    root.querySelectorAll('[data-lit], .tt-h2 [data-burn]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [rootId]);
  return null;
}
