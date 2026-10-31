import type { Metadata } from 'next';
import Link from 'next/link';
import { Scene } from '@/components/Scene';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { fill } from '@/lib/site-words/words';
import { getIntakeWords } from '@/lib/intake/queries';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { stripe } from '@/lib/billing/stripe';
import { recordCheckout, type Recorded } from '@/lib/billing/record';
import { ownerOf } from '@/lib/signup/confirm-email';
import { confirmOwner } from '@/lib/signup/after-paid';
import { CheckEmail } from '@/components/signup/CheckEmail';
import { headers } from 'next/headers';
import { headersOrigin } from '@/lib/backend/request-origin';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const w = (await getIntakeWords(supabaseAdmin())).paid;
  return { title: w.metaTitle, robots: { index: false } };
}

type Search = Promise<Record<string, string | string[] | undefined>>;

const CARD = 'rounded-[18px] border border-white/[0.08] bg-black/30 px-6 py-12 text-center';
const TITLE = 'font-sans text-[24px] font-medium tracking-[-0.02em] text-text';
const BODY = 'mx-auto mt-2 max-w-[440px] text-[15px] leading-[1.6] text-muted';

/**
 * bohdiai.com/start/paid: where Stripe sends a maker back (Alex, Session 119). The
 * checkout is read from Stripe itself (never from the address), recorded if it's
 * paid, and the maker is told to confirm their email. Not paid: back to the plan.
 */
export default async function PaidPage({ searchParams }: { searchParams: Search }): Promise<React.ReactElement> {
  const words = await getIntakeWords(supabaseAdmin());
  const w = words.paid;
  const session = (await searchParams)['session'];

  let recorded: Recorded | 'failed' = { paid: false };
  let email = '';
  if (typeof session === 'string' && session.startsWith('cs_')) {
    try {
      recorded = await recordCheckout(stripe(), supabaseAdmin(), session);
      if (recorded.paid) {
        const owner = await ownerOf(supabaseAdmin(), recorded.tenantId);
        email = owner.email;
        // The first to record the payment sends the email; a failure shows "Send it again".
        if (recorded.first) await confirmOwner(supabaseAdmin(), owner, headersOrigin(await headers())).catch((err: unknown) => logger.error('start/paid: confirmation email failed', { error: err instanceof Error ? err.message : String(err) }));
      }
    } catch (err) {
      logger.error('start/paid: could not read the checkout', { error: err instanceof Error ? err.message : String(err) });
      recorded = 'failed';
    }
  }

  return (
    <Scene>
      <Header />
      <main id="main" className="relative z-content px-3 pb-20 pt-10 md:pb-28 md:pt-16">
        <div className="mx-auto max-w-[620px]">
          {recorded === 'failed' ? (
            <div role="alert" className={CARD}>
              <p className={BODY}>{fill(words.errors.failed, { email: SITE_CONTACT_EMAIL })}</p>
            </div>
          ) : recorded.paid ? (
            <div role="status" className={CARD}>
              <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full border border-honey-warm/40 bg-honey-warm/10 text-[20px] text-honey-warm shadow-[0_0_30px_-6px_rgba(243,201,122,0.6)]">
                ✓
              </div>
              <h1 className={TITLE}>{w.title}</h1>
              <CheckEmail words={words} session={typeof session === 'string' ? session : ''} email={email} contactEmail={SITE_CONTACT_EMAIL} />
            </div>
          ) : (
            <div className={CARD}>
              <h1 className={TITLE}>{w.notPaidTitle}</h1>
              <p className={BODY}>{w.notPaidBody}</p>
              <Link
                href="/start?back=1"
                className="mt-6 inline-block rounded-pill bg-text px-8 py-4 font-sans text-[15px] font-semibold text-bg transition-transform hover:-translate-y-px"
              >
                {w.notPaidButton}
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </Scene>
  );
}
