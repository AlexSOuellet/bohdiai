'use client';

import Image from 'next/image';
import { useEffect, useState, type ReactElement } from 'react';
import { WORK, type WorkEntry } from '@/lib/site/work';

const CYCLE_MS = 5000;

function tagFor(entry: WorkEntry): string {
  return `${entry.kind === 'client' ? 'Client' : 'Sample'} · ${entry.name}`;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

/**
 * The hero's browser frame, cycling real screenshots of real sites with their
 * real addresses. Each one is tagged Client or Sample and links to the live
 * site. Auto-advances; pauses on hover or keyboard focus; holds still for
 * visitors who ask for reduced motion.
 */
export function WorkBrowser(): ReactElement {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = WORK[idx] ?? WORK[0]!;

  useEffect(() => {
    if (paused || prefersReducedMotion()) return undefined;
    const t = setInterval(() => setIdx((i) => (i + 1) % WORK.length), CYCLE_MS);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <div
      className="relative z-sticky mx-auto mt-10 max-w-full md:mt-12 md:max-w-[980px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span
        key={`tag-${current.slug}`}
        className="absolute left-2.5 top-[-11px] z-toast inline-flex max-w-[58%] animate-flash-in items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-pill bg-honey px-2.5 py-1 text-[10px] font-bold text-bg-2 shadow-[0_10px_28px_rgba(233,161,61,0.6),0_0_30px_rgba(243,201,122,0.4)] md:left-9 md:top-[-13px] md:px-3.5 md:py-1.5 md:text-[12px]"
      >
        {tagFor(current)}
      </span>

      <a
        href={current.url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-2.5 top-[-11px] z-toast inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border border-honey-warm/30 bg-bg px-2.5 py-1 text-[10px] font-semibold text-honey-warm no-underline shadow-[0_8px_20px_rgba(0,0,0,0.4)] transition-colors hover:border-honey-warm md:right-9 md:top-[-13px] md:px-3.5 md:py-1.5 md:text-[12px]"
      >
        Visit the live site ↗<span className="sr-only">: {current.name}</span>
      </a>

      <div className="flex animate-browser-bob flex-col overflow-hidden rounded-t-[12px] rounded-b-[8px] border border-white/[0.06] bg-[#1a1612] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.7),0_30px_60px_-20px_rgba(233,161,61,0.15),0_0_1px_rgba(243,201,122,0.2)] md:rounded-t-[18px] md:rounded-b-[12px]">
        <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.05] bg-[#15110a] px-3 py-2.5 md:gap-3 md:px-4 md:py-3">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-[9px] rounded-full bg-[#2c2620] md:size-[11px]" />
            <span className="size-[9px] rounded-full bg-[#2c2620] md:size-[11px]" />
            <span className="size-[9px] rounded-full bg-[#2c2620] md:size-[11px]" />
          </span>
          <div className="flex-1 truncate rounded-[7px] bg-bg px-2 py-1 text-center font-sans text-[10px] text-muted md:px-3.5 md:py-1.5 md:text-[12px]">
            <span className="text-honey" aria-hidden="true">
              🔒{' '}
            </span>
            <span className="sr-only">{current.host}</span>
            <UrlTypewriter key={current.slug} target={current.host} />
          </div>
          <div className="w-5 md:w-14" />
        </div>

        <div className="relative aspect-[1440/760] bg-black">
          <Image
            key={current.slug}
            src={current.shot}
            alt={`${current.name} home page`}
            fill
            sizes="(max-width: 980px) 100vw, 980px"
            loading={idx === 0 ? 'eager' : 'lazy'}
            fetchPriority={idx === 0 ? 'high' : 'auto'}
            className="animate-build-in object-cover object-top"
          />
        </div>
      </div>

      <div className="relative z-content mt-6 flex items-center justify-center gap-2 md:mt-7">
        {WORK.map((w, i) => (
          <button
            key={w.slug}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={`Show ${w.name}`}
            aria-pressed={i === idx}
            className={[
              'group grid h-6 cursor-pointer place-items-center border-0 bg-transparent p-0 transition-[width] duration-base',
              i === idx ? 'w-9' : 'w-6',
            ].join(' ')}
          >
            <span
              aria-hidden="true"
              className={[
                'block h-[9px] rounded-full transition-[background,box-shadow,width] duration-base group-hover:bg-honey-warm/55',
                i === idx ? 'w-7 bg-honey-warm shadow-[0_0_14px_var(--honey-warm)]' : 'w-[9px] bg-text-soft/[0.18]',
              ].join(' ')}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/** Types the address in when the site changes, then holds it. Decorative; the real address is in an sr-only span. */
function UrlTypewriter({ target }: { target: string }): ReactElement {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (count >= target.length) return undefined;
    const t = setTimeout(() => setCount((c) => c + 1), 28);
    return () => clearTimeout(t);
  }, [count, target]);

  return (
    <span aria-hidden="true">
      <span className="font-medium text-text-soft">{target.slice(0, count)}</span>
      <span className="ml-0.5 inline-block h-3 w-0.5 animate-blink bg-honey-warm align-middle" />
    </span>
  );
}
