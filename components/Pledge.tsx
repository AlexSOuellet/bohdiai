import { SectionKicker } from './SectionKicker';

export function Pledge(): React.ReactElement {
  return (
    <section id="pledge" className="relative z-content px-2 py-14 md:py-24">
      <SectionKicker>The pledge</SectionKicker>

      <h2 className="mx-auto mb-10 max-w-[680px] px-3 text-center font-sans text-[28px] font-medium leading-[1.08] tracking-[-0.025em] text-text-soft md:mb-11 md:text-[42px] md:tracking-[-0.03em]">
        Three things I{' '}
        <em className="not-italic text-honey-warm [text-shadow:0_0_32px_rgba(243,201,122,0.5)]">
          promise
        </em>{' '}
        you.
      </h2>

      <ol className="relative mx-auto flex max-w-[680px] flex-col gap-6 pl-9 md:gap-7 md:pl-9 [&::before]:absolute [&::before]:left-2 [&::before]:top-3 [&::before]:bottom-3 [&::before]:w-px [&::before]:content-['']  [&::before]:[background:linear-gradient(to_bottom,transparent,rgba(243,201,122,0.45)_12%,rgba(243,201,122,0.45)_88%,transparent)]">
        <PledgeItem>
          I&apos;ll <b>never take a cut</b> of what you sell. Your customers pay you direct — your
          Stripe, your Square, your bank.
        </PledgeItem>
        <PledgeItem>
          I&apos;ll <b>never lock you in</b>. Your customer list, your emails, your order history —
          yours to export, anytime.
        </PledgeItem>
        <PledgeItem>
          I&apos;ll <b>never sell your data</b> or train AI on your customers. Your shop&apos;s data
          stays in your shop.
        </PledgeItem>
      </ol>

      <div className="mx-auto mt-9 flex max-w-[680px] items-center gap-3.5 pl-9 md:mt-10">
        <span className="h-px w-9 bg-honey-warm/50" />
        <span className="font-sans text-[15px] font-semibold tracking-[-0.005em] text-text">
          Alex Scott
        </span>
        <span className="ml-1.5 text-[13px] text-muted">Founder, BohdiAI</span>
      </div>
    </section>
  );
}

function PledgeItem({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <li className="relative list-none font-serif text-[20px] italic font-normal leading-[1.4] text-text-soft md:text-[26px] before:absolute before:left-[-32px] before:top-[18px] before:size-2.5 before:rounded-full before:bg-honey-warm before:shadow-[0_0_14px_var(--honey-warm),0_0_0_4px_var(--bg)] before:content-['']  [&_b]:font-sans [&_b]:not-italic [&_b]:font-semibold [&_b]:text-honey-warm [&_b]:[text-shadow:0_0_24px_rgba(243,201,122,0.35)]">
      {children}
    </li>
  );
}
