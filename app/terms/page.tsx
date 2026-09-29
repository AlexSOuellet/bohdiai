import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';

export const metadata: Metadata = {
  title: 'Terms — BohdiAI',
  description: 'The terms for using bohdiai.com. Short, plain English.',
};

const CONTACT_EMAIL = SITE_CONTACT_EMAIL;
const LAST_UPDATED = 'September 29, 2026';

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
              bohdiai.com is where I show the websites I build and where you can tell me about
              yours. Using the site, including sending a message through the contact form, is free
              and doesn&apos;t sign you up for anything.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              Sending a message isn&apos;t a contract
            </h2>
            <p>
              A message starts a conversation, nothing more. If we decide to work together, what
              I&apos;ll build, what it costs and when it&apos;s done are agreed in writing before any
              work starts.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              The samples
            </h2>
            <p>
              The sites marked as samples are demonstrations made to show a range of looks. They
              aren&apos;t real businesses, and nothing on them is for sale. The sites marked as
              clients are real businesses, and their own terms apply there.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              Acceptable use
            </h2>
            <p>
              Don&apos;t send messages in someone else&apos;s name. Don&apos;t try to break, scrape,
              or flood the site. I may ignore or delete messages that do.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              Sample legal documents for client sites
            </h2>
            <p>
              When BohdiAI hosts a client&apos;s site, it comes with a sample
              Terms of Service and Privacy Policy as a starting point. These are templates written
              in plain English to cover the common case — they are not legal advice and they are
              not a substitute for a lawyer.
            </p>
            <p className="mt-3">
              Reviewing those documents for accuracy, completeness, and compliance with the laws
              that apply to the shop&apos;s business, location, and customers is the shop owner&apos;s
              responsibility, not BohdiAI&apos;s. The shop can edit them at any time. If the shop
              sells in a regulated category, or to customers in jurisdictions with specific
              requirements (EU/UK GDPR, California CCPA, etc.), the shop is responsible for making
              sure their published terms and privacy policy reflect that.
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
