import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms — BohdiAI',
  description: 'The terms for joining the BohdiAI waitlist. Short, plain English.',
};

const CONTACT_EMAIL = 'alex@bohdiai.com';
const LAST_UPDATED = 'May 19, 2026';

export default function TermsPage(): React.ReactElement {
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

      <article className="mx-auto max-w-[680px] pb-24 pt-10 md:pt-16">
        <div className="mb-4 inline-flex items-center gap-3.5 text-[11px] font-medium uppercase tracking-[0.22em] text-muted md:text-[12px]">
          <span className="size-1.5 rounded-full bg-honey shadow-[0_0_14px_var(--honey)]" />
          Terms
        </div>
        <h1 className="font-sans text-[36px] font-medium leading-[1.05] tracking-[-0.025em] text-text-soft md:text-[52px] md:tracking-[-0.03em]">
          Terms, in plain English.
        </h1>
        <p className="mt-4 text-[13px] text-muted">Last updated: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-8 text-[15px] leading-[1.7] text-text-soft md:text-[16px]">
          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              What this is
            </h2>
            <p>
              Right now, BohdiAI is a waitlist for an upcoming product. You can put your email in,
              and I&apos;ll write when it&apos;s ready. That&apos;s the whole transaction. No
              purchase, no account, no money changes hands.
            </p>
            <p className="mt-3">
              When BohdiAI opens for real and starts handling maker storefronts, these terms will
              be replaced with the real ones — and anyone on the waitlist will see them before
              they sign up for a paid plan.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              No promises about timing
            </h2>
            <p>
              Joining the waitlist doesn&apos;t guarantee you&apos;ll get in at launch, or that
              launch will happen on any particular date, or that pricing won&apos;t change between
              now and then. I&apos;ll be honest about all of it as it firms up.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              No promises about the product
            </h2>
            <p>
              The demo storefronts on the home page are illustrative. The real product will look
              and behave like them — that&apos;s the goal — but specific features, screens, and
              wording can change before launch.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              Acceptable use
            </h2>
            <p>
              Don&apos;t submit someone else&apos;s email. Don&apos;t try to break, scrape, or
              flood the site. I reserve the right to remove anyone from the waitlist for any
              reason, without notice, especially in those cases.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              No warranties
            </h2>
            <p>
              The site is provided as-is. I&apos;ll do my best to keep it up and working, but
              I&apos;m not liable for losses tied to it being down, slow, or wrong. If something
              breaks, tell me at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-honey-warm underline underline-offset-4 decoration-honey-warm/40 hover:decoration-honey-warm">
                {CONTACT_EMAIL}
              </a>{' '}
              and I&apos;ll fix it.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              Governing law
            </h2>
            <p>
              These terms are governed by the laws of the State of Rhode Island, USA. Any dispute
              that can&apos;t be sorted out by email goes to the state or federal courts located
              in Rhode Island.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              Contact
            </h2>
            <p>
              BohdiAI is built and operated by Alex Ouellet (publicly: Alex Scott) in Rhode
              Island, USA.{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-honey-warm underline underline-offset-4 decoration-honey-warm/40 hover:decoration-honey-warm">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-white/5 pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[14px] text-text-soft no-underline transition-colors hover:text-honey-warm"
          >
            ← Back to the page
          </Link>
        </div>
      </article>
    </main>
  );
}
