import { SectionKicker } from './SectionKicker';

const SKOOL_URL = 'https://www.skool.com/wits-end-breakthrough-7869';

export function Community(): React.ReactElement {
  return (
    <section id="community" className="relative z-content px-3 py-14 md:py-24">
      <SectionKicker>Community</SectionKicker>

      <h2 className="mx-auto max-w-[720px] px-3 text-center font-sans text-[28px] font-medium leading-[1.1] tracking-[-0.025em] text-text-soft md:text-[42px] md:tracking-[-0.03em]">
        This isn&apos;t just a tool. There&apos;s{' '}
        <em className="not-italic text-honey-warm [text-shadow:0_0_32px_rgba(243,201,122,0.5)]">
          a room
        </em>{' '}
        behind it.
      </h2>

      <p className="mx-auto mt-3.5 max-w-[540px] px-3.5 text-center text-[14px] leading-[1.55] text-muted md:mt-4 md:text-[15px]">
        If AI feels like the moment computers did in the 90s — overwhelming, full of jargon, and
        moving faster than you&apos;d like — you don&apos;t have to figure it out alone.
      </p>

      <div className="mx-auto mt-8 max-w-[640px] rounded-[18px] border border-honey-warm/[0.18] p-7 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7),0_0_60px_-20px_rgba(243,201,122,0.12)] backdrop-blur-[20px] [background:radial-gradient(ellipse_at_top,rgba(243,201,122,0.08),transparent_70%),linear-gradient(180deg,rgba(26,20,16,0.85),rgba(10,8,5,0.7))] md:mt-11 md:rounded-[20px] md:p-9 md:pb-7">
        <span className="mb-5 inline-flex items-center gap-2 rounded-pill border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
          <span className="grid size-3.5 place-items-center rounded-[4px] bg-gradient-to-br from-[#ffd76e] to-[#b76b1e] font-sans text-[10px] font-extrabold tracking-[-0.04em] text-bg-2">
            S
          </span>
          On Skool
        </span>

        <div className="mb-3 font-sans text-[30px] font-medium leading-[1.05] tracking-[-0.025em] text-text md:text-[36px]">
          Witsend{' '}
          <em className="not-italic text-honey-warm [text-shadow:0_0_24px_rgba(243,201,122,0.4)]">
            Breakthroughs
          </em>
        </div>

        <p className="mx-auto mb-5 max-w-[440px] text-[14px] leading-[1.55] text-text-soft md:text-[15px]">
          A small room for makers, owners, and curious humans figuring out the AI transition
          together. Run by Alex. Honest answers, no hype.
        </p>

        <div className="mb-6">
          <div className="inline-flex items-center gap-2.5 rounded-pill border border-honey-warm/[0.25] bg-honey-warm/[0.08] px-3.5 py-1.5 text-[12px] font-medium text-text-soft">
            <span className="inline-block size-1.5 animate-pulse-ring rounded-full bg-honey-warm shadow-[0_0_10px_var(--honey-warm)]" />
            <b className="font-semibold text-honey-warm">Just opened</b> · join the first cohort
          </div>
        </div>

        <a
          href={SKOOL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-pill bg-gradient-to-b from-honey-warm to-honey-deep px-6 py-3.5 font-sans text-[15px] font-bold text-bg-2 no-underline shadow-[0_10px_28px_-8px_rgba(243,201,122,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] transition-transform hover:-translate-y-px"
        >
          Join the room →
        </a>

        <p className="mt-4 text-[11px] tracking-[0.01em] text-muted">
          Free to join. You don&apos;t need a BohdiAI account.
        </p>
      </div>
    </section>
  );
}
