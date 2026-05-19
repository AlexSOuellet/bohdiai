'use client';

import { useEffect, useRef, useState } from 'react';

type Storefront = {
  liveUrl: string;
  typewriter: string;
  cart: string;
  brandName: string;
  brandTagline: string;
  bg: string;
  text: string;
  accent: string;
};

const STOREFRONTS: readonly Storefront[] = [
  {
    liveUrl: 'junes-sourdough.bohdiai.com',
    typewriter: 'junes-sourdough.bohdiai.com',
    cart: 'Cart · 3',
    brandName: "June's Sourdough",
    brandTagline: 'Country, seeded, and a special cinnamon-raisin · Pickup Saturday',
    bg: '#fbf5e8',
    text: '#1a1410',
    accent: '#a96812',
  },
  {
    liveUrl: 'iron-and-ash.bohdiai.com',
    typewriter: 'iron-and-ash.bohdiai.com',
    cart: '2 of 6',
    brandName: 'Iron & Ash',
    brandTagline: 'Custom blackwork · By appointment only · Providence, RI',
    bg: '#0a0908',
    text: '#e8dfd1',
    accent: '#c9a87a',
  },
  {
    liveUrl: 'posy-lane-books.bohdiai.com',
    typewriter: 'posy-lane-books.bohdiai.com',
    cart: 'Cart · 1',
    brandName: 'Posy Lane Books',
    brandTagline: 'Picture books for kids 3 to 7 · Signed editions',
    bg: '#fef3e0',
    text: '#2a1f15',
    accent: '#d4a574',
  },
];

const CYCLE_MS = 6500;

export function BrowserDemo(): React.ReactElement {
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
      className="relative mx-auto mt-8 h-[620px] max-w-full md:mt-7 md:h-[700px] md:max-w-[980px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onClick={() => setPaused((p) => !p)}
    >
      {/* Live URL pill — top right */}
      <span className="absolute right-2.5 top-[-10px] z-toast inline-flex max-w-[60%] items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap rounded-pill border border-honey-warm/30 bg-bg px-2.5 py-1 text-[10px] font-semibold text-honey-warm shadow-[0_8px_20px_rgba(0,0,0,0.4)] md:right-9 md:top-[-12px] md:gap-2 md:px-3.5 md:py-1.5 md:text-[12px]">
        <span className="size-1.5 animate-pulse-ring rounded-full bg-honey shadow-[0_0_10px_var(--honey)]" />
        Live · {current.liveUrl}
      </span>

      {/* Browser frame */}
      <div className="flex h-full animate-browser-bob flex-col overflow-hidden rounded-t-[12px] rounded-b-[8px] border border-white/[0.06] bg-[#1a1612] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.7),0_30px_60px_-20px_rgba(233,161,61,0.15),0_0_1px_rgba(243,201,122,0.2)] md:rounded-t-[18px] md:rounded-b-[12px]">
        {/* Browser bar: traffic dots + URL with typewriter + spacer */}
        <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.05] bg-[#15110a] px-3 py-2.5 md:gap-3 md:px-4 md:py-3">
          <span className="flex gap-1.5">
            <span className="size-[9px] rounded-full bg-[#2c2620] md:size-[11px]" />
            <span className="size-[9px] rounded-full bg-[#2c2620] md:size-[11px]" />
            <span className="size-[9px] rounded-full bg-[#2c2620] md:size-[11px]" />
          </span>
          <div className="flex-1 rounded-[7px] bg-bg px-2 py-1 text-center font-sans text-[10px] text-muted md:px-3.5 md:py-1.5 md:text-[12px]">
            <span className="text-honey">🔒 </span>
            <UrlTypewriter target={current.typewriter} />
          </div>
          <div className="w-5 md:w-14" />
        </div>

        {/* Storefront content area — for now: themed placeholder per storefront */}
        <div className="flex-1 overflow-hidden">
          <StorefrontPlaceholder storefront={current} />
        </div>
      </div>

      {/* Dot navigators — below the frame */}
      <div className="relative z-content mt-6 flex items-center justify-center gap-2.5 md:mt-7">
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
              'h-[9px] rounded-full border-0 transition-[background,box-shadow,width] duration-base hover:bg-honey-warm/55',
              i === idx
                ? 'w-7 bg-honey-warm shadow-[0_0_14px_var(--honey-warm)]'
                : 'w-[9px] bg-text-soft/[0.18]',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );
}

function UrlTypewriter({ target }: { target: string }): React.ReactElement {
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

function StorefrontPlaceholder({ storefront }: { storefront: Storefront }): React.ReactElement {
  return (
    <div
      className="flex h-full flex-col items-center justify-center px-6 py-8 text-center transition-colors duration-500"
      style={{ backgroundColor: storefront.bg, color: storefront.text }}
    >
      <div
        className="mb-3 font-sans text-xs uppercase tracking-[0.16em] opacity-60"
        style={{ color: storefront.accent }}
      >
        Demo storefront
      </div>
      <h3 className="mb-2 font-sans text-[28px] font-medium tracking-[-0.02em] md:text-[36px]">
        {storefront.brandName}
      </h3>
      <p className="max-w-[420px] text-[14px] leading-relaxed opacity-70 md:text-[15px]">
        {storefront.brandTagline}
      </p>
      <div className="mt-6 text-[11px] uppercase tracking-[0.14em] opacity-40">
        Full storefronts wiring in next session
      </div>
    </div>
  );
}
