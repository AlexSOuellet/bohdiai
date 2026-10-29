/**
 * bohdiai.com builds up the plans before it prices them (Alex, Session 108; the
 * ladder, Session 113): four steps up, each including the one before. Free is
 * the tools, Showcase puts you online, Market adds the full site and the market
 * app, Full opens up online selling. The cards climb left to right on wide
 * screens; on phones they stack.
 */
import { SectionKicker } from '@/components/SectionKicker';
import { FREE_OFFER, planById, type PlanId } from '@/lib/site/plans';

const H2 =
  'mx-auto max-w-[780px] px-3 text-center font-sans text-[30px] font-medium leading-[1.05] tracking-[-0.025em] text-text-soft md:text-[48px] md:tracking-[-0.03em]';
const EM = 'not-italic text-honey-warm [text-shadow:0_0_32px_rgba(243,201,122,0.5)]';

type Step = { name: string; title: string; body: string; includes?: string; rise: string };

const name = (id: PlanId): string => planById(id).name;

const STEPS: readonly Step[] = [
  {
    name: FREE_OFFER.name,
    title: FREE_OFFER.title,
    body: 'Free, no card. Know what each piece costs you, what to charge for it, and whether a market is worth the trip.',
    rise: 'xl:mt-36',
  },
  {
    name: name('maker-showcase'),
    title: 'Be found',
    body: 'A real place online for your work. Someone who meets you at a market, or hears about you from a friend, can look you up, see what you make and know you’re the real thing.',
    includes: FREE_OFFER.name,
    rise: 'xl:mt-24',
  },
  {
    name: name('maker-lite'),
    title: 'Sell at your markets',
    body: 'A full website with your whole catalog, every piece with its photo and price, and where you’ll be next. At your table, the market app takes the sale: shoppers scan a code, pick a piece and pay.',
    includes: name('maker-showcase'),
    rise: 'xl:mt-12',
  },
  {
    name: name('maker-full'),
    title: 'Sell online too',
    body: 'A shop with a cart and checkout, payments straight into your own Stripe or Square, orders and shipping in one place, and cards at your booth.',
    includes: name('maker-lite'),
    rise: 'xl:mt-0',
  },
];

export function PlanLadder(): React.ReactElement {
  return (
    <section id="ladder" aria-labelledby="ladder-title" className="relative z-content mx-auto max-w-[1280px] scroll-mt-20 px-4 pt-24 md:pt-32">
      <SectionKicker>The plans</SectionKicker>
      <h2 id="ladder-title" className={H2}>
        Start small, <em className={EM}>grow when you’re ready</em>
      </h2>
      <p className="mx-auto mt-4 max-w-[560px] text-center text-[15px] leading-[1.55] text-muted md:text-[16px]">
        Start free with the tools. Every plan after that is a real site of your own, and each one adds to the one before it.
      </p>

      <ol className="mt-12 grid gap-5 md:mt-16 md:grid-cols-2 md:items-start md:gap-6 xl:grid-cols-4">
        {STEPS.map((s) => (
          <li
            key={s.name}
            className={`relative flex flex-col rounded-[20px] border border-white/10 p-6 backdrop-blur-[20px] [background:linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] md:p-7 ${s.rise}`}
          >
            <span className="text-[13px] font-semibold text-honey-warm">{s.name}</span>
            <h3 className="mt-2 font-sans text-[26px] font-medium leading-[1.1] tracking-[-0.02em] text-text md:text-[30px]">{s.title}</h3>
            {s.includes !== undefined && (
              <p className="mt-2 text-[13px] text-muted">Everything in {s.includes}, plus</p>
            )}
            <p className="mt-4 text-[15px] leading-[1.6] text-text-soft">{s.body}</p>
          </li>
        ))}
      </ol>

      <p className="mt-10 text-center">
        <a
          href="#plans"
          className="inline-flex items-center gap-2 border-b border-honey-warm/35 pb-0.5 text-[14px] font-semibold text-honey-warm no-underline transition-colors hover:border-honey-warm"
        >
          See what each one costs ↓
        </a>
      </p>
    </section>
  );
}
