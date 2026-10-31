import type { Metadata } from 'next';
import { Scene } from '@/components/Scene';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SignupForm, type SignupPlan } from '@/components/signup/SignupForm';
import { supabaseAdmin } from '@/lib/supabase';
import { getIntakeWords } from '@/lib/intake/queries';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { FREE_OFFER, plansFor } from '@/lib/site/plans';
import { FREE_PLAN } from '@/lib/backend/plan/plan';
import { startingSignup } from '@/lib/intake/start';

// The form's words live in the database and can change without a deploy.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const w = (await getIntakeWords(supabaseAdmin())).page;
  return { title: w.metaTitle, description: w.metaDescription };
}

type Search = Promise<Record<string, string | string[] | undefined>>;

/** bohdiai.com/start: the plan and the account, then Stripe (Alex, Session 119). */
export default async function StartPage({ searchParams }: { searchParams: Search }): Promise<React.ReactElement> {
  const start = startingSignup(await searchParams);
  const plans: SignupPlan[] = [
    { plan: FREE_PLAN, name: FREE_OFFER.name, monthly: 0, yearly: 0 },
    ...plansFor('maker').map((p) => ({ plan: p.tier, name: p.name, monthly: p.monthly, yearly: p.yearly })),
  ];
  const words = await getIntakeWords(supabaseAdmin());
  return (
    <Scene>
      <Header />
      <main id="main" className="relative z-content px-3 pb-20 pt-10 md:pb-28 md:pt-16">
        <h1 className="mx-auto max-w-[820px] text-center font-sans text-[34px] font-medium leading-[1.05] tracking-[-0.02em] text-text md:text-[56px] md:tracking-[-0.03em]">
          {words.signup.title}
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-center text-[15px] leading-[1.6] text-text-soft md:text-[17px]">{words.signup.lede}</p>
        <div className="mx-auto mt-12 max-w-[860px] md:mt-16">
          <SignupForm words={words} plans={plans} initialPlan={start.plan} initialBilling={start.billing} back={start.back} contactEmail={SITE_CONTACT_EMAIL} />
        </div>
      </main>
      <Footer />
    </Scene>
  );
}
