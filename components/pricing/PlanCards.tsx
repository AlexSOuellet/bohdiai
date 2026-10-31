'use client';

/**
 * The plan cards on a pricing page, with one Monthly / Yearly
 * switch above them. Plans are clear glass; the one plan with a badge (Showcase, "Most popular")
 * is lit with a honey edge and carries the badge beside its name. A maker plan's
 * button opens sign-up (bohdiai.com/start) with the plan and monthly or yearly
 * filled in; a contractor plan's "Talk to us" goes to the page's contact form
 * with the plan. Makers see Maker Free first (Alex, Session 117): no price to
 * switch; its button opens sign-up on Free (Alex, Session 119).
 */
import { useState } from 'react';
import Link from 'next/link';
import { FREE_OFFER, formatPrice, includesLead, plansFor, type Audience, type Plan } from '@/lib/site/plans';
import { FREE_PLAN_ID } from '@/lib/intake/start';

type Period = 'monthly' | 'yearly';

const PERIODS: ReadonlyArray<{ value: Period; label: string }> = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly · 2 months free' },
];

export function PlanCards({ audience }: { audience: Audience }): React.ReactElement {
  const [period, setPeriod] = useState<Period>('monthly');
  const plans = plansFor(audience);
  const free = audience === 'maker';
  const count = plans.length + (free ? 1 : 0);
  const grid = count >= 4 ? 'md:grid-cols-2 xl:grid-cols-4' : count === 3 ? 'lg:grid-cols-3 md:grid-cols-2' : 'md:grid-cols-2';
  return (
    <div className={`mx-auto ${count >= 4 ? 'max-w-[1320px]' : count === 3 ? 'max-w-[1180px]' : 'max-w-[980px]'}`}>
      <fieldset className="mx-auto flex w-fit rounded-pill border border-white/10 bg-black/40 p-1 backdrop-blur-[20px]">
        <legend className="sr-only">Pay monthly or yearly</legend>
        {PERIODS.map((p) => (
          <label
            key={p.value}
            className="cursor-pointer rounded-pill px-4 py-2 text-[12px] font-semibold text-muted transition-colors duration-base has-[:checked]:bg-honey-warm has-[:checked]:text-bg has-[:checked]:shadow-[0_0_24px_-4px_rgba(243,201,122,0.6)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-honey-warm md:px-5 md:text-[13px]"
          >
            <input
              type="radio"
              name={`period-${audience}`}
              value={p.value}
              checked={period === p.value}
              onChange={() => setPeriod(p.value)}
              className="sr-only"
            />
            {p.label}
          </label>
        ))}
      </fieldset>

      <div className={`mt-9 grid items-stretch gap-6 md:mt-12 md:gap-7 ${grid}`}>
        {free && <FreeCard />}
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} period={period} />
        ))}
      </div>
    </div>
  );
}

function FreeCard(): React.ReactElement {
  return (
    <article
      aria-labelledby="plan-maker-free"
      className="relative flex flex-col overflow-hidden rounded-[22px] border border-dashed border-white/15 p-6 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.85)] backdrop-blur-[20px] [background:linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] md:p-8"
    >
      <h3 id="plan-maker-free" className="font-sans text-[22px] font-semibold tracking-[-0.02em] text-text md:text-[24px]">
        {FREE_OFFER.name}
      </h3>
      <p className="mt-1.5 min-h-[2.6em] text-[14px] leading-[1.45] text-muted md:text-[15px]">{FREE_OFFER.forWho}</p>

      <div className="mt-6 flex items-baseline gap-2">
        <span className="font-sans text-[52px] font-semibold leading-none tracking-[-0.045em] text-text-soft md:text-[64px]">
          {formatPrice(0)}
        </span>
        <span className="text-[14px] text-muted">always</span>
      </div>

      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {FREE_OFFER.includes.map((item) => (
          <li key={item} className="flex gap-3 text-[14px] leading-[1.5] text-text-soft md:text-[15px]">
            <span aria-hidden="true" className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-honey" />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-6 border-t border-white/[0.08] pt-4 text-[13px] leading-[1.5] text-muted">{FREE_OFFER.noSite}</p>
      <Link
        href={{ pathname: '/start', query: { plan: FREE_PLAN_ID } }}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-pill border border-white/20 px-6 py-3.5 text-[14px] font-semibold text-text no-underline transition-transform hover:-translate-y-px"
      >
        Start free →
      </Link>
    </article>
  );
}

function PlanCard({ plan, period }: { plan: Plan; period: Period }): React.ReactElement {
  const full = plan.tier === 'full';
  const featured = plan.badge !== undefined;
  const price = period === 'monthly' ? plan.monthly : plan.yearly;
  const headingId = `plan-${plan.id}`;
  return (
    <article
      aria-labelledby={headingId}
      className={[
        'relative flex flex-col overflow-hidden rounded-[22px] border p-6 backdrop-blur-[20px] md:p-8',
        featured
          ? 'border-honey-warm/40 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.85),0_0_80px_-24px_rgba(243,201,122,0.35)] [background:radial-gradient(120%_70%_at_100%_0%,rgba(243,201,122,0.16),transparent_60%),linear-gradient(180deg,rgba(32,24,16,0.92),rgba(12,9,6,0.85))]'
          : 'border-white/10 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.85)] [background:linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))]',
      ].join(' ')}
    >
      {featured && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-0 h-px [background:linear-gradient(90deg,transparent,var(--honey-warm),transparent)]"
        />
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3
          id={headingId}
          className={`font-sans text-[22px] font-semibold tracking-[-0.02em] md:text-[24px] ${featured ? 'text-honey-warm' : 'text-text'}`}
        >
          {plan.name}
        </h3>
        {plan.badge !== undefined && (
          <span className="rounded-pill bg-honey-warm px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-bg shadow-[0_0_20px_-4px_rgba(243,201,122,0.7)]">
            {plan.badge}
          </span>
        )}
      </div>
      <p className="mt-1.5 min-h-[2.6em] text-[14px] leading-[1.45] text-muted md:text-[15px]">{plan.forWho}</p>

      <div className="mt-6 flex items-baseline gap-2">
        <span
          className={`font-sans text-[52px] font-semibold leading-none tracking-[-0.045em] md:text-[64px] ${featured ? 'text-text [text-shadow:0_0_40px_rgba(243,201,122,0.35)]' : 'text-text-soft'}`}
        >
          {formatPrice(price)}
        </span>
        <span className="text-[14px] text-muted">{period === 'monthly' ? 'a month' : 'a year'}</span>
      </div>

      {/* Service sites are made by hand with no build fee; makers pay from sign-up (Alex, Session 108). */}
      {plan.audience === 'contractor' && (
        <p className="mt-3 inline-flex w-fit items-center gap-2 rounded-pill border border-honey-warm/30 bg-honey-warm/[0.08] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-honey-warm">
          <span className="size-1.5 rounded-full bg-honey-warm shadow-[0_0_10px_var(--honey-warm)]" />
          Built free
        </p>
      )}

      {full && <p className="mt-6 text-[13px] font-semibold text-text-soft">{includesLead(plan)}</p>}
      <ul className={`${full ? 'mt-3' : 'mt-6'} flex flex-1 flex-col gap-3`}>
        {plan.includes.map((item) => (
          <li key={item} className="flex gap-3 text-[14px] leading-[1.5] text-text-soft md:text-[15px]">
            <span aria-hidden="true" className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-honey" />
            {item}
          </li>
        ))}
      </ul>

      <Link
        href={plan.audience === 'maker' ? { pathname: '/start', query: { plan: plan.id, billing: period } } : { pathname: '/', query: { plan: plan.id }, hash: 'contact' }}
        className={[
          'mt-8 inline-flex items-center justify-center gap-2 rounded-pill px-6 py-3.5 text-[14px] font-semibold no-underline transition-transform hover:-translate-y-px',
          featured ? 'bg-honey-warm text-bg shadow-[0_10px_40px_-10px_rgba(243,201,122,0.7)]' : 'bg-text text-bg',
        ].join(' ')}
      >
        {plan.audience === 'maker' ? 'Start your site →' : 'Talk to us →'}
      </Link>
    </article>
  );
}
