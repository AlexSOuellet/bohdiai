import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';

export const metadata: Metadata = {
  title: 'Privacy — BohdiAI',
  description:
    'What bohdiai.com collects, why, and how to get it deleted. Short, plain English.',
};

const CONTACT_EMAIL = SITE_CONTACT_EMAIL;
const LAST_UPDATED = 'September 29, 2026';

export default function PrivacyPage(): React.ReactElement {
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
          Privacy
        </div>
        <h1 className="font-sans text-[36px] font-medium leading-[1.05] tracking-[-0.025em] text-text-soft md:text-[52px] md:tracking-[-0.03em]">
          Privacy, in plain English.
        </h1>
        <p className="mt-4 text-[13px] text-muted">Last updated: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-8 text-[15px] leading-[1.7] text-text-soft md:text-[16px]">
          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              What I collect
            </h2>
            <p>
              Only what you type into the contact form on the home page: your name, your email, your
              phone number if you give one, how you like to be reached,
              what kind of business you run, your message, and a link if you add one. Nothing else.
              No tracking pixels, no analytics following you around the internet.
            </p>
          </section>
          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              Why I collect it
            </h2>
            <p>
              So I can read about your project and write back to you. That&apos;s it. No mailing
              list, no promo blasts, no selling or sharing it with anyone for marketing.
            </p>
          </section>
          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              Where it goes
            </h2>
            <p>
              Your message is sent to my inbox by{' '}
              <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-honey-warm underline underline-offset-4 decoration-honey-warm/40 hover:decoration-honey-warm">
                Resend
              </a>
              , the email service this site uses. It isn&apos;t saved in a database on this site;
              it lives in my email, the same as if you&apos;d written to me directly.
            </p>
            <p className="mt-3">
              The site runs on{' '}
              <a href="https://www.cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-honey-warm underline underline-offset-4 decoration-honey-warm/40 hover:decoration-honey-warm">
                Cloudflare
              </a>
              , which sees the ordinary details every website sees, like your IP address, and uses
              them to keep the site secure and to stop the form from being flooded with spam.
            </p>
          </section>
          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              How to get it deleted
            </h2>
            <p>
              Email{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-honey-warm underline underline-offset-4 decoration-honey-warm/40 hover:decoration-honey-warm">
                {CONTACT_EMAIL}
              </a>{' '}
              and I&apos;ll delete your messages within 7 days. If you&apos;re in the EU/UK, this
              is your GDPR right to erasure. Same process, same response.
            </p>
          </section>
          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              Cookies
            </h2>
            <p>
              None. This site doesn&apos;t set marketing or tracking cookies, and there are no ad
              networks.
            </p>
          </section>
          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              Changes to this policy
            </h2>
            <p>
              If this ever changes, the new version goes on this page with the date at the top.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              Who&apos;s responsible
            </h2>
            <p>
              BohdiAI is built and operated by Alex Ouellet (publicly: Alex Scott) in Rhode
              Island, USA. Questions, requests, complaints — all go to{' '}
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
