import Link from 'next/link';
import type { Metadata } from 'next';
import { BohdiLogo } from '@/components/BohdiLogo';

export const metadata: Metadata = {
  title: 'Confirmation link issue — BohdiAI',
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: { reason?: string };
};

export default function ConfirmErrorPage({ searchParams }: Props) {
  const isServer = searchParams.reason === 'server';
  const heading = isServer ? 'Something on our end.' : 'That link didn’t work.';
  const body = isServer
    ? 'We hit a snag confirming your email. Try the link again in a moment — if it keeps failing, reply to the confirmation email and we’ll fix it by hand.'
    : 'The confirmation link is missing, malformed, or already used. If you signed up recently, you can ask for a fresh link from the waitlist page.';

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-[640px] px-6 pt-10 md:px-10 md:pt-14">
        <Link href="/" className="focus-ring inline-block rounded">
          <BohdiLogo />
        </Link>
      </div>
      <div className="mx-auto max-w-[640px] px-6 pb-24 pt-12 text-center md:px-10 md:pt-20">
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-honey-700">
          / confirmation
        </div>
        <h1 className="mt-3 font-serif text-[36px] font-light leading-[1.05] tracking-[-0.02em] text-ink-900 md:text-[48px]">
          {heading}
        </h1>
        <p className="mx-auto mt-5 max-w-[44ch] text-[16px] leading-relaxed text-ink-700">{body}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/#waitlist"
            className="btn-primary focus-ring rounded-full px-6 py-3.5 text-[14px] font-medium"
          >
            Back to the waitlist &nbsp;→
          </Link>
        </div>
      </div>
    </main>
  );
}
