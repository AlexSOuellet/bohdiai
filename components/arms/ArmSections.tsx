/**
 * The pieces the two marketing arms are built from (makers.bohdiai.com and
 * service.bohdiai.com): the opening, the looks, the plans, what everyone else
 * costs, and the most-asked questions. Each arm's page orders them itself.
 * Each audience sees only its own plans, never the other's prices.
 */
import Link from 'next/link';
import { SectionKicker } from '@/components/SectionKicker';
import { LookBrowser } from '@/components/LookBrowser';
import { PlanCards } from '@/components/pricing/PlanCards';
import { Comparison } from '@/components/pricing/Comparison';
import { FaqList } from '@/components/faq/FaqList';
import { TOP_QUESTIONS, faqItem } from '@/lib/site/faq';
import { LOOKS_WORDS } from '@/lib/site/looks';
import type { Audience } from '@/lib/site/plans';

const H2 =
  'mx-auto max-w-[780px] px-3 text-center font-sans text-[30px] font-medium leading-[1.05] tracking-[-0.025em] text-text-soft md:text-[48px] md:tracking-[-0.03em]';
const EM = 'not-italic text-honey-warm [text-shadow:0_0_32px_rgba(243,201,122,0.5)]';
const LEDE = 'mx-auto mt-4 max-w-[560px] text-center text-[15px] leading-[1.55] text-muted md:text-[16px]';

type Action = { href: string; label: string };

export function ArmHero({
  badge,
  sub,
  primary,
  secondary,
}: {
  badge: string;
  sub: string;
  primary: Action;
  secondary: Action;
}): React.ReactElement {
  return (
    <div className="px-2 pt-10 text-center md:pt-16">
      <div className="mb-5 inline-flex items-center gap-2.5 rounded-pill border border-honey-warm/30 bg-honey-warm/[0.08] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-honey-warm shadow-[0_0_24px_-8px_rgba(243,201,122,0.4)] backdrop-blur-[20px] md:mb-7 md:text-[11px]">
        <span className="size-1.5 animate-pulse-ring rounded-full bg-honey-warm shadow-[0_0_12px_var(--honey-warm)]" />
        {badge}
      </div>
      <h1 className="mx-auto max-w-[900px] font-sans text-[34px] font-medium leading-[1.05] tracking-[-0.02em] text-text-soft md:text-[60px] md:tracking-[-0.03em]">
        <span className="inline-block text-text">A real web developer</span>{' '}
        <br />
        <span className="inline-block animate-pulse-glow text-honey-warm">for less than a site builder</span>
      </h1>
      <p className="mx-auto mt-4 max-w-[600px] px-1 text-[15px] leading-[1.55] text-muted md:mt-5 md:text-[17px]">{sub}</p>
      <div className="mt-6 flex flex-col items-stretch gap-2.5 px-6 md:mt-7 md:flex-row md:items-center md:justify-center md:gap-3 md:px-0">
        <a
          href={primary.href}
          className="inline-flex items-center justify-center gap-2 rounded-pill bg-text px-5 py-3 text-[14px] font-semibold text-bg no-underline md:px-6"
        >
          {primary.label}
        </a>
        <a
          href={secondary.href}
          className="inline-flex items-center justify-center gap-2 rounded-pill border border-white/[0.12] bg-white/[0.03] px-5 py-3 text-[14px] font-semibold text-text-soft no-underline backdrop-blur-[20px] md:px-6"
        >
          {secondary.label}
        </a>
      </div>
    </div>
  );
}

/** Classic Loafs in every mood, right under the opening: seeing their own kind of shop change is what sells a maker. */
export function LooksSection({ local }: { local: boolean }): React.ReactElement {
  return (
    <section id="looks" aria-labelledby="looks-title" className="relative z-content scroll-mt-20 pt-20 md:pt-28">
      <SectionKicker>{LOOKS_WORDS.kicker}</SectionKicker>
      <h2 id="looks-title" className={H2}>
        {LOOKS_WORDS.title}
      </h2>
      <p className={LEDE}>{LOOKS_WORDS.lede}</p>
      <LookBrowser local={local} />
    </section>
  );
}

export function PlansSection({ audience }: { audience: Audience }): React.ReactElement {
  return (
    <section id="plans" aria-label="Plans" className="relative z-content scroll-mt-20 px-3 pt-24 md:pt-32">
      <SectionKicker>Pricing</SectionKicker>
      <h2 className={H2}>
        Built free, <em className={EM}>paid once it’s live</em>
      </h2>
      <div className="mt-10 md:mt-14">
        <PlanCards audience={audience} />
      </div>
    </section>
  );
}

export function CompareSection({ audience, sub }: { audience: Audience; sub: string }): React.ReactElement {
  return (
    <section id="compare" className="relative z-content px-3 pt-24 md:pt-36">
      <SectionKicker>Compare</SectionKicker>
      <h2 className={H2}>
        What everyone <em className={EM}>else</em> costs
      </h2>
      <p className={`${LEDE} mb-10 md:mb-14`}>{sub}</p>
      <Comparison audience={audience} />
    </section>
  );
}

export function FaqSection({ audience }: { audience: Audience }): React.ReactElement {
  return (
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
  );
}
