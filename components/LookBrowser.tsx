'use client';

import { useState, type ReactElement } from 'react';
import { LOOKS, LOOKS_WORDS as W, lookUrl, type Look } from '@/lib/site/looks';

/**
 * The look picker: one row of moods above the real sample site in a browser
 * window. Picking a mood reloads the window in it; the phone switch narrows the
 * window to a phone's width. Nothing is copied: it is the live site, drawn in
 * each mood through its preview address.
 */
export function LookBrowser({ local }: { local: boolean }): ReactElement {
  const [current, setCurrent] = useState<Look>(LOOKS[0]!);
  const [phone, setPhone] = useState(false);
  const url = lookUrl(current, local);

  return (
    <div className="relative z-content mx-auto mt-10 max-w-[1180px] px-3 md:mt-14 md:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label={W.moods} className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1 md:mx-0 md:flex-wrap md:px-0">
          {LOOKS.map((look) => {
            const on = look.family === current.family;
            return (
              <button
                key={look.family}
                type="button"
                aria-pressed={on}
                onClick={() => setCurrent(look)}
                className={[
                  'inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-pill border px-3.5 py-2 text-[13px] font-medium transition-colors',
                  on ? 'border-honey-warm bg-honey-warm text-bg-2' : 'border-white/10 bg-white/5 text-text-soft hover:border-honey-warm/50',
                ].join(' ')}
              >
                <svg aria-hidden="true" viewBox="0 0 18 12" className="h-3 w-[18px] overflow-hidden rounded-full ring-1 ring-black/20">
                  {look.swatch.map((c, i) => (
                    <rect key={i} x={i * 6} y={0} width={6} height={12} fill={c} />
                  ))}
                </svg>
                {look.label}
              </button>
            );
          })}
        </div>
        <div role="group" aria-label={W.view} className="hidden rounded-pill md:inline-flex border border-white/10 bg-white/5 p-1 text-[12px] font-medium">
          {[false, true].map((isPhone) => (
            <button
              key={String(isPhone)}
              type="button"
              aria-pressed={phone === isPhone}
              onClick={() => setPhone(isPhone)}
              className={['cursor-pointer rounded-pill px-3 py-1.5 transition-colors', phone === isPhone ? 'bg-white/15 text-text' : 'text-muted hover:text-text-soft'].join(' ')}
            >
              {isPhone ? W.phone : W.computer}
            </button>
          ))}
        </div>
      </div>

      <div
        className={[
          'mx-auto mt-5 overflow-hidden rounded-t-[14px] rounded-b-[10px] border border-white/[0.06] bg-[#1a1612] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.7),0_30px_60px_-20px_rgba(233,161,61,0.15)] transition-[max-width] duration-300',
          phone ? 'max-w-[400px]' : 'max-w-full',
        ].join(' ')}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.05] bg-[#15110a] px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-[10px] rounded-full bg-[#2c2620]" />
            <span className="size-[10px] rounded-full bg-[#2c2620]" />
            <span className="size-[10px] rounded-full bg-[#2c2620]" />
          </span>
          <div className="flex-1 truncate rounded-[7px] bg-bg px-3 py-1 text-center text-[12px] text-muted">{current.label}</div>
          <a href={url} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-[12px] font-semibold text-honey-warm no-underline hover:underline">
            {W.open}
          </a>
        </div>
        <iframe
          key={url}
          src={url}
          title={W.frameTitle.replace('{mood}', current.label)}
          className={['block w-full border-0 bg-white', phone ? 'h-[760px]' : 'h-[78vh] min-h-[560px]'].join(' ')}
        />
      </div>
    </div>
  );
}
