import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy — BohdiAI',
  description:
    'What BohdiAI collects, why, and how to get your data deleted. Short, plain English.',
};

const CONTACT_EMAIL = 'alex@bohdiai.com';
const LAST_UPDATED = 'May 19, 2026';

export default function PrivacyPage(): React.ReactElement {
  return (
    <main className="min-h-screen px-4 py-10 md:px-8 md:py-14">
      <a
        href="/"
        className="inline-flex items-center gap-2.5 rounded-pill border border-white/10 bg-white/5 px-3 py-2 text-[13px] font-medium text-text-soft no-underline backdrop-blur-[20px]"
      >
        <span className="grid size-6 place-items-center rounded-[7px] bg-gradient-to-br from-honey-warm to-honey-deep text-[13px] font-bold text-bg-2">
          B
        </span>
        BohdiAI
      </a>

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
              Right now, only your email address — and only if you put it in the waitlist form on
              the home page. Nothing else. No name, no phone, no tracking pixels following you
              around the internet.
            </p>
            <p className="mt-3">
              BohdiAI uses{' '}
              <a href="https://posthog.com" target="_blank" rel="noopener noreferrer" className="text-honey-warm underline underline-offset-4 decoration-honey-warm/40 hover:decoration-honey-warm">
                PostHog
              </a>{' '}
              for basic, privacy-respecting analytics (page views, button clicks) and{' '}
              <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-honey-warm underline underline-offset-4 decoration-honey-warm/40 hover:decoration-honey-warm">
                Sentry
              </a>{' '}
              for error reports when something breaks. Neither sells your data, and neither is
              tied to your email.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              Why I collect it
            </h2>
            <p>
              To tell you when BohdiAI opens for real, and occasionally — rarely — when there&apos;s
              something genuinely worth your attention along the way. That&apos;s it. No promo
              blasts. No selling the list. No sharing with third parties for marketing.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              Where it lives
            </h2>
            <p>
              Emails are stored in{' '}
              <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-honey-warm underline underline-offset-4 decoration-honey-warm/40 hover:decoration-honey-warm">
                Supabase
              </a>{' '}
              (Postgres database, encrypted at rest, US region) and synced to{' '}
              <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-honey-warm underline underline-offset-4 decoration-honey-warm/40 hover:decoration-honey-warm">
                Resend
              </a>{' '}
              so I can actually send you the confirmation and the eventual launch email.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              How to get out
            </h2>
            <p>
              Every email I send has a one-click unsubscribe. If you want your record fully
              deleted (not just unsubscribed), email{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-honey-warm underline underline-offset-4 decoration-honey-warm/40 hover:decoration-honey-warm">
                {CONTACT_EMAIL}
              </a>{' '}
              and I&apos;ll delete it within 7 days. If you&apos;re in the EU/UK, this is your GDPR
              right to erasure — same process, same response.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              Cookies
            </h2>
            <p>
              No marketing cookies. PostHog uses a first-party cookie to count unique visits;
              it doesn&apos;t identify you personally. No cross-site tracking, no ad networks.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-[20px] font-semibold tracking-[-0.01em] text-text md:text-[22px]">
              Changes to this policy
            </h2>
            <p>
              When BohdiAI opens for real and starts handling maker storefronts, this policy
              will grow to cover that. I&apos;ll date any update at the top, and material changes
              will be emailed to people on the waitlist before they take effect.
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
          <a
            href="/"
            className="inline-flex items-center gap-2 text-[14px] text-text-soft no-underline transition-colors hover:text-honey-warm"
          >
            ← Back to the page
          </a>
        </div>
      </article>
    </main>
  );
}
