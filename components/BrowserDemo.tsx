'use client';

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { SourdoughStore } from './storefronts/SourdoughStore';
import { TattooStore } from './storefronts/TattooStore';
import { KidsStore } from './storefronts/KidsStore';

type Storefront = {
  liveUrl: string;
  brandName: string;
  newOrder: string;
  render: () => ReactElement;
};

const STOREFRONTS: readonly Storefront[] = [
  {
    liveUrl: 'junes-sourdough.bohdiai.com',
    brandName: "June's Sourdough",
    newOrder: '✨ +1 new order — cinnamon loaf',
    render: () => <SourdoughStore />,
  },
  {
    liveUrl: 'ironandash-tattoo.bohdiai.com',
    brandName: 'Iron & Ash',
    newOrder: '✨ +1 consult requested',
    render: () => <TattooStore />,
  },
  {
    liveUrl: 'posylane-books.bohdiai.com',
    brandName: 'Posy Lane Books',
    newOrder: '✨ +1 pre-order — Fox and Lantern',
    render: () => <KidsStore />,
  },
];

const CYCLE_MS = 6500;

export function BrowserDemo(): ReactElement {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = STOREFRONTS[idx] ?? STOREFRONTS[0]!;

  // Auto-cycle, paused on hover/tap
  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % STOREFRONTS.length);
    }, CYCLE_MS);
    return () => clearInterval(t);
  }, [paused]);

  function jumpTo(i: number): void {
    setIdx(i);
    setPaused(false);
  }

  return (
    <div
      className="relative z-sticky mx-auto mt-8 h-[620px] max-w-full md:mt-7 md:h-[700px] md:max-w-[980px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onClick={() => setPaused((p) => !p)}
    >
      {/* +1 new-order pill — top left, flashes in periodically */}
      <span
        key={`order-${idx}`}
        className="absolute left-2.5 top-[-10px] z-toast inline-flex animate-flash-in items-center gap-1.5 whitespace-nowrap rounded-pill bg-honey px-2.5 py-1 text-[10px] font-bold text-bg-2 shadow-[0_10px_28px_rgba(233,161,61,0.6),0_0_30px_rgba(243,201,122,0.4)] md:left-9 md:top-[-12px] md:px-3.5 md:py-1.5 md:text-[12px]"
        style={{ animationDuration: '13s' }}
      >
        {current.newOrder}
      </span>

      {/* Live URL pill — top right */}
      <span className="absolute right-2.5 top-[-10px] z-toast inline-flex max-w-[60%] items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap rounded-pill border border-honey-warm/30 bg-bg px-2.5 py-1 text-[10px] font-semibold text-honey-warm shadow-[0_8px_20px_rgba(0,0,0,0.4)] md:right-9 md:top-[-12px] md:gap-2 md:px-3.5 md:py-1.5 md:text-[12px]">
        <span className="size-1.5 animate-pulse-ring rounded-full bg-honey shadow-[0_0_10px_var(--honey)]" />
        Live · {current.liveUrl}
      </span>

      {/* Browser frame */}
      <div className="flex h-full animate-browser-bob flex-col overflow-hidden rounded-t-[12px] rounded-b-[8px] border border-white/[0.06] bg-[#1a1612] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.7),0_30px_60px_-20px_rgba(233,161,61,0.15),0_0_1px_rgba(243,201,122,0.2)] md:rounded-t-[18px] md:rounded-b-[12px]">
        {/* Browser bar */}
        <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.05] bg-[#15110a] px-3 py-2.5 md:gap-3 md:px-4 md:py-3">
          <span className="flex gap-1.5">
            <span className="size-[9px] rounded-full bg-[#2c2620] md:size-[11px]" />
            <span className="size-[9px] rounded-full bg-[#2c2620] md:size-[11px]" />
            <span className="size-[9px] rounded-full bg-[#2c2620] md:size-[11px]" />
          </span>
          <div className="flex-1 rounded-[7px] bg-bg px-2 py-1 text-center font-sans text-[10px] text-muted md:px-3.5 md:py-1.5 md:text-[12px]">
            <span className="text-honey">🔒 </span>
            <UrlTypewriter target={current.liveUrl} />
          </div>
          <div className="w-5 md:w-14" />
        </div>

        {/* Storefront content — rotates per idx.
            aria-hidden because the rendered storefronts are decorative marketing
            art (fake products, fake CTAs that don't navigate). The brand name
            and URL pill above already announce the demo to screen readers. */}
        <div className="flex-1 overflow-hidden" aria-hidden="true" role="presentation">
          {current.render()}
        </div>
      </div>

      {/* Dot navigators. Button is sized to a 24px hit target (WCAG 2.5.8 AA);
          the visible dot lives in the inner span so the design stays unchanged. */}
      <div className="relative z-content mt-6 flex items-center justify-center gap-2 md:mt-7">
        {STOREFRONTS.map((s, i) => (
          <button
            key={s.liveUrl}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              jumpTo(i);
            }}
            aria-label={`Show ${s.brandName} storefront`}
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
                i === idx
                  ? 'w-7 bg-honey-warm shadow-[0_0_14px_var(--honey-warm)]'
                  : 'w-[9px] bg-text-soft/[0.18]',
              ].join(' ')}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function UrlTypewriter({ target }: { target: string }): ReactElement {
  const [text, setText] = useState(target);
  const targetRef = useRef(target);

  useEffect(() => {
    targetRef.current = target;
    let charIdx = target.length;
    let dir: 1 | -1 = -1;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function tick(): void {
      const t = targetRef.current;
      setText(t.slice(0, charIdx));
      if (dir === 1) {
        if (charIdx < t.length) {
          charIdx += 1;
          timer = setTimeout(tick, 70);
        } else {
          timer = setTimeout(() => {
            dir = -1;
            tick();
          }, 4500);
        }
      } else {
        if (charIdx > 0) {
          charIdx -= 1;
          timer = setTimeout(tick, 35);
        } else {
          timer = setTimeout(() => {
            dir = 1;
            tick();
          }, 600);
        }
      }
    }

    tick();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [target]);

  return (
    <>
      <span className="font-medium text-text-soft">{text}</span>
      <span className="ml-0.5 inline-block h-3 w-0.5 animate-blink bg-honey-warm align-middle" />
    </>
  );
}

