import { WorkBrowser } from './WorkBrowser';

export function Hero(): React.ReactElement {
  return (
    <div className="px-2 pt-4 text-center md:pt-6">
      <div className="mb-5 inline-flex items-center gap-2.5 rounded-pill border border-honey-warm/30 bg-honey-warm/[0.08] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-honey-warm shadow-[0_0_24px_-8px_rgba(243,201,122,0.4)] backdrop-blur-[20px] md:mb-7 md:text-[11px]">
        <span className="size-1.5 animate-pulse-ring rounded-full bg-honey-warm shadow-[0_0_12px_var(--honey-warm)]" />
        Websites for makers, contractors &amp; charities
      </div>

      <h1 className="mx-auto max-w-[900px] font-sans text-[34px] font-medium leading-[1.05] tracking-[-0.02em] text-text-soft md:text-[56px] md:tracking-[-0.03em]">
        {/* Each half wraps as a unit, so a narrow screen breaks between phrases, never inside one. */}
        <span className="inline-block text-text">If you make it, bake it,</span>{' '}
        <span className="inline-block">fix it or fund it,</span>{' '}
        <br />
        <span className="inline-block animate-pulse-glow text-honey-warm">we build it for you</span>
      </h1>

      <p className="mx-auto mt-4 max-w-[590px] px-1 text-[15px] font-normal leading-[1.55] text-muted md:mt-5 md:text-[17px]">
        A real website for your shop, your trade or your cause. You tell me about your work, I build the site,
        and every dollar your customers pay goes straight to you.
      </p>

      <div className="mt-6 flex flex-col items-stretch gap-2.5 px-6 md:mt-7 md:flex-row md:items-center md:justify-center md:gap-3 md:px-0">
        <a
          href="#contact"
          className="inline-flex items-center justify-center gap-2 rounded-pill bg-text px-5 py-3 text-[14px] font-semibold text-bg no-underline md:px-6"
        >
          Tell me about your project →
        </a>
        <a
          href="#work"
          className="inline-flex items-center justify-center gap-2 rounded-pill border border-white/[0.12] bg-white/[0.03] px-5 py-3 text-[14px] font-semibold text-text-soft no-underline backdrop-blur-[20px] md:px-6"
        >
          See the work
        </a>
      </div>

      <WorkBrowser />
    </div>
  );
}
