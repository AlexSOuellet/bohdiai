import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'You’re in — BohdiAI',
  robots: { index: false, follow: false },
};

const SKOOL_URL = 'https://www.skool.com/wits-end-breakthrough-7869';

export default function ConfirmedPage(): React.ReactElement {
  return (
    <main className="min-h-screen px-4 py-10 md:px-8 md:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-2.5 rounded-pill border border-white/10 bg-white/5 px-3 py-2 text-[13px] font-medium text-text-soft no-underline backdrop-blur-[20px]"
      >
        <span className="grid size-6 place-items-center rounded-[7px] bg-gradient-to-br from-honey-warm to-honey-deep text-[13px] font-bold text-bg-2">
          B
        </span>
        BohdiAI
      </Link>

      <div className="mx-auto max-w-[640px] pb-24 pt-12 text-center md:pt-20">
        <div className="mb-4 inline-flex items-center justify-center gap-3.5 text-[11px] font-medium uppercase tracking-[0.22em] text-muted md:text-[12px]">
          <span className="size-1.5 rounded-full bg-honey shadow-[0_0_14px_var(--honey)]" />
          Confirmed
          <span className="size-1.5 rounded-full bg-honey shadow-[0_0_14px_var(--honey)]" />
        </div>
        <h1 className="font-sans text-[36px] font-medium leading-[1.05] tracking-[-0.025em] text-text-soft md:text-[56px] md:tracking-[-0.03em]">
          You&apos;re{' '}
          <em className="not-italic text-honey-warm [text-shadow:0_0_32px_rgba(243,201,122,0.5)]">
            in
          </em>
          .
        </h1>
        <p className="mx-auto mt-5 max-w-[44ch] text-[15px] leading-[1.6] text-text-soft md:text-[17px]">
          Thanks for confirming. I&apos;ll write when there&apos;s something real to share — no
          promo blasts in between.
        </p>
        <p className="mx-auto mt-5 max-w-[44ch] text-[14px] leading-[1.55] text-muted">
          In the meantime, the Witsend Breakthroughs community is the best place to start.
        </p>
        <div className="mt-8 flex flex-col items-stretch gap-3 px-6 md:flex-row md:items-center md:justify-center md:px-0">
          <a
            href={SKOOL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-pill bg-gradient-to-b from-honey-warm to-honey-deep px-6 py-3.5 font-sans text-[14px] font-bold text-bg-2 no-underline shadow-[0_10px_28px_-8px_rgba(243,201,122,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]"
          >
            Join the community →
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-pill border border-white/[0.12] bg-white/[0.03] px-6 py-3.5 font-sans text-[14px] font-semibold text-text-soft no-underline backdrop-blur-[20px]"
          >
            Back to the page
          </Link>
        </div>
      </div>
    </main>
  );
}
