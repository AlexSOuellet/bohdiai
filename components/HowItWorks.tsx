import { SectionKicker } from './SectionKicker';

// The onboarding step-1 input: pick a craft from the grid, pick a mood. One of
// each is shown selected (others dimmed) so the card mirrors the real flow
// rather than someone typing a sentence.
const CRAFT_CHIPS = ['Candle maker', 'Baker', 'Jeweler', 'Potter'] as const;
const MOOD_CHIPS = ['Cozy', 'Rustic', 'Modern', 'Elegant'] as const;
const SELECTED_CRAFT = 'Candle maker';
const SELECTED_MOOD = 'Cozy';

export function HowItWorks(): React.ReactElement {
  return (
    <section id="how" className="relative z-content px-3 pb-12 pt-16 md:pb-20 md:pt-32">
      <SectionKicker>How it works</SectionKicker>

      <h2 className="mx-auto max-w-[720px] px-3 text-center font-sans text-[30px] font-medium leading-[1.05] tracking-[-0.025em] text-text-soft md:text-[48px] md:tracking-[-0.03em]">
        Three steps.{' '}
        <em className="not-italic text-honey-warm [text-shadow:0_0_32px_rgba(243,201,122,0.5)]">
          No code.
        </em>{' '}
        No templates.
      </h2>
      <p className="mx-auto mt-3.5 max-w-[560px] px-3 text-center text-[14px] leading-[1.55] text-muted md:mt-5 md:text-[16px]">
        Pick your craft, watch Bohdi build it, then tell him what to change. That&apos;s the whole thing.
      </p>

      <div className="relative mt-11 grid grid-cols-1 gap-9 md:mt-18 md:grid-cols-3 md:gap-5">
        {/* Connecting line: vertical on mobile (center column), horizontal on desktop */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-[30px] bottom-[30px] z-base w-px -translate-x-1/2 md:left-[8%] md:right-[8%] md:top-[88px] md:h-px md:w-auto md:bottom-auto md:translate-x-0 [background:linear-gradient(to_bottom,transparent,rgba(243,201,122,0.4)_12%,rgba(243,201,122,0.4)_88%,transparent)] md:[background:linear-gradient(to_right,transparent,rgba(243,201,122,0.4)_20%,rgba(243,201,122,0.4)_80%,transparent)]"
        />

        <Step num="01" title="Pick your craft and a mood" copy="Choose what you make from the list, then the feeling you want. That's the whole input.">
          <PromptCard />
        </Step>
        <Step num="02" title="Bohdi builds your storefront" copy="A complete working site tuned to your kind of business — not a template anyone else has.">
          <Orb />
        </Step>
        <Step num="03" title="Tell Bohdi what to change" copy="Your personal designer, on call. Ask for anything in plain words — no tech to figure out. Publish when it's perfect, and keep every dollar you make.">
          <LiveBadge />
        </Step>
      </div>
    </section>
  );
}

function Step({
  num,
  title,
  copy,
  children,
}: {
  num: string;
  title: string;
  copy: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="relative z-raised px-3 text-center md:px-3">
      <span className="relative z-content inline-block bg-bg px-3.5 font-sans text-[38px] font-light leading-none tracking-[-0.04em] text-honey-warm [text-shadow:0_0_24px_rgba(243,201,122,0.5)] md:px-4.5 md:text-[48px]">
        {num}
      </span>
      <div className="relative my-5 flex h-[130px] items-center justify-center md:my-7 md:h-[160px]">
        {children}
      </div>
      <h3 className="mb-2 font-sans text-[19px] font-medium tracking-[-0.015em] text-text md:text-[22px]">
        {title}
      </h3>
      <p className="mx-auto max-w-[280px] text-[13px] leading-[1.55] text-muted md:text-[14px]">
        {copy}
      </p>
    </div>
  );
}

function PromptCard(): React.ReactElement {
  return (
    <div className="w-full max-w-[260px] rounded-lg border border-text/[0.12] bg-text/[0.04] p-3.5 text-left text-[12px] leading-[1.5] text-text-soft backdrop-blur-[8px] md:max-w-[280px] md:p-4 md:text-[13px]">
      <div className="mb-1.5 text-[11px] tracking-[0.05em] text-muted">YOUR CRAFT</div>
      <div className="flex flex-wrap gap-1.5">
        {CRAFT_CHIPS.map((craft) => (
          <Chip key={craft} label={craft} selected={craft === SELECTED_CRAFT} />
        ))}
      </div>
      <div className="mb-1.5 mt-3 text-[11px] tracking-[0.05em] text-muted">MOOD</div>
      <div className="flex flex-wrap gap-1.5">
        {MOOD_CHIPS.map((mood) => (
          <Chip key={mood} label={mood} selected={mood === SELECTED_MOOD} />
        ))}
      </div>
    </div>
  );
}

function Chip({ label, selected }: { label: string; selected: boolean }): React.ReactElement {
  return (
    <span
      className={
        selected
          ? 'rounded-full border border-honey-warm/50 bg-honey-warm/15 px-2.5 py-1 text-[11px] text-honey-warm'
          : 'rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-muted'
      }
    >
      {label}
    </span>
  );
}

function Orb(): React.ReactElement {
  return (
    <div className="relative size-[100px] md:size-[120px]">
      {/* Outer rotating ring */}
      <span className="absolute -inset-1.5 rounded-full border border-honey-warm/[0.15] [border-right-color:var(--honey)] animate-ring-spin-rev md:-inset-2" />
      {/* Inner rotating ring */}
      <span className="absolute inset-0 rounded-full border border-honey-warm/30 [border-top-color:var(--honey-warm)] animate-ring-spin" />
      {/* Core */}
      <span className="absolute inset-[25px] animate-orb-pulse rounded-full shadow-[0_0_30px_var(--honey-warm),0_0_60px_var(--honey)] [background:radial-gradient(circle,#fff3d6_0%,var(--honey-warm)_50%,var(--honey-deep)_90%)] md:inset-[30px]" />
    </div>
  );
}

function LiveBadge(): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-3.5">
      <span className="inline-flex items-center gap-1.5 rounded-pill bg-honey-warm px-3 py-1 text-[11px] font-bold tracking-[0.04em] text-bg-2">
        <span className="inline-block size-1.5 animate-pulse-dark rounded-full bg-bg-2" />
        LIVE
      </span>
      <span className="inline-flex items-center gap-2 rounded-md border border-text/[0.15] bg-text/[0.06] px-3 py-1.5 font-sans text-[12px] text-text-soft md:text-[13px]">
        <span className="text-honey">🔒</span>yourshop.bohdiai.com
      </span>
    </div>
  );
}
