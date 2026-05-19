import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Confirmation link issue — BohdiAI',
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function ConfirmErrorPage({ searchParams }: Props): Promise<React.ReactElement> {
  const { reason } = await searchParams;
  const isServer = reason === 'server';
  const heading = isServer ? 'Something on our end.' : 'That link didn’t work.';
  const body = isServer
    ? 'We hit a snag confirming your email. Try the link again in a moment — if it keeps failing, reply to the confirmation email and we’ll fix it by hand.'
    : 'The confirmation link is missing, malformed, or already used. If you signed up recently, you can ask for a fresh link from the waitlist page.';

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
          Confirmation
          <span className="size-1.5 rounded-full bg-honey shadow-[0_0_14px_var(--honey)]" />
        </div>
        <h1 className="font-sans text-[32px] font-medium leading-[1.05] tracking-[-0.025em] text-text-soft md:text-[48px] md:tracking-[-0.03em]">
          {heading}
        </h1>
        <p className="mx-auto mt-5 max-w-[44ch] text-[15px] leading-[1.55] text-text-soft md:text-[16px]">
          {body}
        </p>
        <div className="mt-8">
          <Link
            href="/#waitlist"
            className="inline-flex items-center gap-2 rounded-pill bg-gradient-to-b from-honey-warm to-honey-deep px-6 py-3.5 font-sans text-[14px] font-bold text-bg-2 no-underline shadow-[0_10px_28px_-8px_rgba(243,201,122,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]"
          >
            Back to the waitlist →
          </Link>
        </div>
      </div>
    </main>
  );
}
