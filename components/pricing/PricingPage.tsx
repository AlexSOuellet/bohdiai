/**
 * The body shared by bohdiai.com/makers and /contractors: the pitch, the two
 * plans, what everyone else costs, real work for this audience, and the form.
 * Each audience sees only its own plans — never the other's prices.
 */
import { Scene } from '@/components/Scene';
import { Header } from '@/components/Header';
import { Work } from '@/components/Work';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { SectionKicker } from '@/components/SectionKicker';
import { PlanCards, type PricingPath } from './PlanCards';
import { Comparison } from './Comparison';
import Link from 'next/link';
import { FaqList } from '@/components/faq/FaqList';
import { TOP_QUESTIONS, faqItem } from '@/lib/site/faq';
import type { Audience } from '@/lib/site/plans';

const H2 =
  'mx-auto max-w-[780px] px-3 text-center font-sans text-[30px] font-medium leading-[1.05] tracking-[-0.025em] text-text-soft md:text-[48px] md:tracking-[-0.03em]';
const EM = 'not-italic text-honey-warm [text-shadow:0_0_32px_rgba(243,201,122,0.5)]';

export type PricingCopy = {
  badge: string;
  sub: string;
  compareSub: string;
};

export function PricingPage({
  audience,
  path,
  copy,
}: {
  audience: Audience;
  path: PricingPath;
  copy: PricingCopy;
}): React.ReactElement {
  return (
    <Scene>
      <Header />
      <main id="main">
        <div className="px-2 pt-10 text-center md:pt-16">
          <div className="mb-5 inline-flex items-center gap-2.5 rounded-pill border border-honey-warm/30 bg-honey-warm/[0.08] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-honey-warm shadow-[0_0_24px_-8px_rgba(243,201,122,0.4)] backdrop-blur-[20px] md:mb-7 md:text-[11px]">
            <span className="size-1.5 animate-pulse-ring rounded-full bg-honey-warm shadow-[0_0_12px_var(--honey-warm)]" />
            {copy.badge}
          </div>
          <h1 className="mx-auto max-w-[900px] font-sans text-[34px] font-medium leading-[1.05] tracking-[-0.02em] text-text-soft md:text-[60px] md:tracking-[-0.03em]">
            <span className="inline-block text-text">A real web developer</span>{' '}
            <br />
            <span className="inline-block animate-pulse-glow text-honey-warm">for less than a site builder</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[600px] px-1 text-[15px] leading-[1.55] text-muted md:mt-5 md:text-[17px]">
            {copy.sub}
          </p>
        </div>

        <section id="plans" aria-label="Plans" className="relative z-content px-3 pt-12 md:pt-16">
          <PlanCards audience={audience} path={path} />
        </section>

        <section id="compare" className="relative z-content px-3 pt-24 md:pt-36">
          <SectionKicker>Compare</SectionKicker>
          <h2 className={H2}>
            What everyone <em className={EM}>else</em> costs
          </h2>
          <p className="mx-auto mb-10 mt-4 max-w-[560px] text-center text-[15px] leading-[1.55] text-muted md:mb-14 md:text-[16px]">
            {copy.compareSub}
          </p>
          <Comparison audience={audience} />
        </section>

        <section id="questions" className="relative z-content mx-auto max-w-[760px] px-3 pt-24 md:pt-32">
          <SectionKicker>FAQ</SectionKicker>
          <div className="mt-6">
            <FaqList items={TOP_QUESTIONS[audience].map((id) => faqItem(id))} />
          </div>
          <p className="mt-6 text-center">
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 border-b border-honey-warm/35 pb-0.5 text-[14px] font-semibold text-honey-warm no-underline transition-colors hover:border-honey-warm"
            >
              See the full FAQ →
            </Link>
          </p>
        </section>

        <Work audience={audience} />
        <Contact audience={audience} />
      </main>
      <Footer />
    </Scene>
  );
}
