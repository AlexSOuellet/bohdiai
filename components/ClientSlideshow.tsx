'use client';

import { useState, type KeyboardEvent, type ReactElement } from 'react';
import type { WorkEntry } from '@/lib/site/work';
import { ClientQuotes } from './ClientQuote';
import { WorkShot } from './WorkShot';

type Direction = 'next' | 'prev';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function ClientSpread({ entry }: { entry: WorkEntry }): ReactElement {
  return (
    <>
      <div className="group grid items-center gap-7 md:grid-cols-[1.35fr_1fr] md:gap-14">
        <a
          href={entry.url}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={-1}
          aria-hidden="true"
          className="block transition-transform duration-slow ease-out group-hover:rotate-0 group-hover:scale-[1.01] md:-rotate-[1.2deg]"
        >
          <WorkShot entry={entry} sizes="(max-width: 768px) 100vw, 640px" />
        </a>
        <div className="text-left">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-honey-warm">
            <span className="size-1.5 rounded-full bg-honey-warm shadow-[0_0_10px_var(--honey-warm)]" />
            Client · {entry.category}
          </span>
          <h3 className="mt-3.5 font-sans text-[28px] font-medium leading-[1.05] tracking-[-0.025em] text-text md:text-[34px]">
            {entry.name}
          </h3>
          <p className="mt-4 max-w-[440px] text-[15px] leading-[1.6] text-muted md:text-[16px]">
            {entry.blurb}
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {entry.features.map((f) => (
              <li
                key={f}
                className="rounded-pill border border-white/[0.1] bg-white/[0.03] px-3 py-1 text-[12px] text-text-soft"
              >
                {f}
              </li>
            ))}
          </ul>
          <a
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 border-b border-honey-warm/35 pb-0.5 text-[14px] font-semibold text-honey-warm no-underline transition-colors hover:border-honey-warm"
          >
            Visit the site ↗<span className="sr-only">: {entry.name}</span>
          </a>
        </div>
      </div>
      {entry.testimonials.length > 0 && <ClientQuotes quotes={entry.testimonials} />}
    </>
  );
}

const ARROW =
  'grid size-12 shrink-0 cursor-pointer place-items-center rounded-full border border-honey-warm/35 bg-bg text-[20px] text-honey-warm shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-[border-color,box-shadow,transform] duration-base hover:-translate-y-0.5 hover:border-honey-warm hover:shadow-[0_8px_24px_rgba(0,0,0,0.45),0_0_22px_rgba(243,201,122,0.35)] md:size-14';

/**
 * The real client sites, one at a time, moved by arrows (Alex, 2026-10-06).
 * Each slide is the full spread: screenshot, blurb, features, link, and the
 * client's own words. No autoplay, so nobody loses a testimonial mid-read.
 * The arrows wrap around; the keyboard's arrow keys work inside the slideshow.
 * With a single client there is nothing to move, so no controls show.
 */
export function ClientSlideshow({ clients }: { clients: readonly WorkEntry[] }): ReactElement | null {
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState<Direction>('next');
  const current = clients[idx];
  if (current === undefined) return null;
  const count = clients.length;

  const go = (d: Direction): void => {
    setDirection(d);
    setIdx((i) => (d === 'next' ? (i + 1) % count : (i - 1 + count) % count));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>): void => {
    if (count < 2) return;
    if (e.key === 'ArrowRight') go('next');
    else if (e.key === 'ArrowLeft') go('prev');
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Client sites"
      onKeyDown={onKeyDown}
      className="mt-14 md:mt-20"
    >
      {count > 1 && (
        <div className="mb-10 flex items-center justify-center gap-5 md:mb-14 md:gap-8">
          <button type="button" onClick={() => go('prev')} aria-label="Previous client" className={ARROW}>
            <span aria-hidden="true">←</span>
          </button>
          <div className="flex min-w-[140px] flex-col items-center gap-2.5 md:min-w-[200px]">
            <span className="font-sans text-[13px] font-semibold tabular-nums tracking-[0.2em] text-text-soft">
              <span className="text-honey-warm">{pad(idx + 1)}</span>
              <span className="text-muted"> / {pad(count)}</span>
            </span>
            <span className="flex w-full gap-1.5" aria-hidden="true">
              {clients.map((c, i) => (
                <span
                  key={c.slug}
                  className={[
                    'h-[3px] flex-1 rounded-full transition-[background,box-shadow] duration-base',
                    i === idx ? 'bg-honey-warm shadow-[0_0_12px_var(--honey-warm)]' : 'bg-text-soft/[0.15]',
                  ].join(' ')}
                />
              ))}
            </span>
          </div>
          <button type="button" onClick={() => go('next')} aria-label="Next client" className={ARROW}>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}

      <div aria-live="polite">
        <article
          key={current.slug}
          aria-roledescription="slide"
          aria-label={`${idx + 1} of ${count}: ${current.name}`}
          className={direction === 'next' ? 'motion-safe:animate-slide-from-right' : 'motion-safe:animate-slide-from-left'}
        >
          <ClientSpread entry={current} />
        </article>
      </div>
    </section>
  );
}
