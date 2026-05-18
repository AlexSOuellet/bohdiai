import Link from 'next/link';
import type { Metadata } from 'next';
import { BohdiLogo } from '@/components/BohdiLogo';

export const metadata: Metadata = {
  title: 'You’re in — BohdiAI',
  robots: { index: false, follow: false },
};

const SKOOL_URL = 'https://www.skool.com/wits-end-breakthrough-7869';

export default function ConfirmedPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-[640px] px-6 pt-10 md:px-10 md:pt-14">
        <Link href="/" className="focus-ring inline-block rounded">
          <BohdiLogo />
        </Link>
      </div>
      <div className="mx-auto max-w-[640px] px-6 pb-24 pt-12 text-center md:px-10 md:pt-20">
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-honey-700">
          / confirmed
        </div>
        <h1 className="mt-3 font-serif text-[40px] font-light leading-[1.05] tracking-[-0.02em] text-ink-900 md:text-[56px]">
          You&rsquo;re in.
        </h1>
        <p className="mx-auto mt-5 max-w-[44ch] text-[17px] leading-relaxed text-ink-700">
          Thanks for confirming. I&rsquo;ll write when there&rsquo;s something real to share &mdash;
          no promo blasts in between.
        </p>
        <p className="mx-auto mt-5 max-w-[44ch] text-[15px] leading-relaxed text-ink-600">
          In the meantime, the Witsend Breakthroughs community is the best place to start.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={SKOOL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary focus-ring rounded-full px-6 py-3.5 text-[14px] font-medium"
          >
            Join the community &nbsp;→
          </a>
          <Link
            href="/"
            className="focus-ring rounded-full border border-ink-900/20 px-6 py-3.5 text-[14px] font-medium text-ink-900 transition-colors hover:border-ink-900/60"
          >
            Back to the page
          </Link>
        </div>
      </div>
    </main>
  );
}
