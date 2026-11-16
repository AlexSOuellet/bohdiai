import Link from 'next/link';
import { Wordmark } from '@/components/Wordmark';

/** The look of bohdiai.com's plain pages (the terms, the maker terms): the wordmark,
 *  a title, the words, and a way back. Every word comes from the page. */
export function PlainPage({
  title,
  updated,
  back,
  children,
}: {
  title: string;
  updated?: string;
  back: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <main id="main" className="min-h-screen px-4 py-10 md:px-8 md:py-14">
      <Link
        href="/"
        className="inline-flex items-center rounded-pill border border-white/10 bg-white/5 px-4 py-2 no-underline backdrop-blur-[20px]"
      >
        <Wordmark className="text-[22px]" />
      </Link>
      <article className="mx-auto max-w-[680px] pb-24 pt-10 md:pt-16">
        <h1 className="font-sans text-[36px] font-medium leading-[1.05] tracking-[-0.025em] text-text-soft md:text-[52px] md:tracking-[-0.03em]">
          {title}
        </h1>
        {updated !== undefined && <p className="mt-4 text-[13px] text-muted">{updated}</p>}
        <div className="mt-10 space-y-6 text-[15px] leading-[1.7] text-text-soft md:text-[16px]">
          {children}
        </div>
        <div className="mt-12 border-t border-white/5 pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[14px] text-text-soft no-underline transition-colors hover:text-honey-warm"
          >
            {back}
          </Link>
        </div>
      </article>
    </main>
  );
}

export const PLAIN_HEADING =
  'pt-4 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]';
