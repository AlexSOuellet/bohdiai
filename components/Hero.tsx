import { Rotator } from './Rotator';

export function Hero(): React.ReactElement {
  return (
    <div className="px-2 pt-4 text-center md:pt-6">
      <div className="mb-5 inline-flex items-center gap-2.5 rounded-pill border border-honey-warm/30 bg-honey-warm/[0.08] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-honey-warm shadow-[0_0_24px_-8px_rgba(243,201,122,0.4)] backdrop-blur-[20px] md:mb-7 md:tracking-[0.16em]">
        <span className="size-1.5 animate-pulse-ring rounded-full bg-honey-warm shadow-[0_0_12px_var(--honey-warm)]" />
        Beta opening — summer 2026
      </div>

      <h1 className="mx-auto max-w-[820px] font-sans text-[32px] font-medium leading-[1.05] tracking-[-0.02em] text-text-soft md:text-[48px] md:tracking-[-0.03em]">
        <span className="text-text">Your storefront.</span> Built by AI.
        <br />
        <span className="inline-block animate-pulse-glow text-honey-warm">Live in minutes.</span>
      </h1>

      <p className="mx-auto mt-3.5 max-w-[560px] px-1 text-[14px] font-normal leading-[1.5] text-muted md:mt-5 md:text-[16px]">
        Tell BohdiAI you&apos;re <Rotator /> — get back a real, working storefront built for the way{' '}
        <i>your</i> business actually runs. You keep 100% of what you sell.
      </p>

      <div className="mt-5 flex flex-col items-stretch gap-2.5 px-6 md:mt-6 md:flex-row md:items-center md:justify-center md:gap-3 md:px-0">
        <a
          href="#waitlist"
          className="inline-flex items-center justify-center gap-2 rounded-pill bg-text px-5 py-3 text-[14px] font-semibold text-bg no-underline md:px-6"
        >
          Reserve your shop name →
        </a>
        <a
          href="#how"
          className="inline-flex items-center justify-center gap-2 rounded-pill border border-white/[0.12] bg-white/[0.03] px-5 py-3 text-[14px] font-semibold text-text-soft no-underline backdrop-blur-[20px] md:px-6"
        >
          See how it works
        </a>
      </div>

      <div className="mx-auto mt-8 grid h-[620px] max-w-full place-items-center rounded-lg border border-white/[0.06] bg-bg-2/60 md:mt-7 md:h-[700px] md:max-w-[980px]">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">
          BrowserDemo wiring in next
        </p>
      </div>
    </div>
  );
}
