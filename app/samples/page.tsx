import type { Metadata } from 'next';
import { Scene } from '@/components/Scene';
import { Header } from '@/components/Header';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { SectionKicker } from '@/components/SectionKicker';
import { WorkShot } from '@/components/WorkShot';
import { planName, samplesByPlan } from '@/lib/site/work';

export const metadata: Metadata = {
  title: 'Samples — BohdiAI',
  description: 'Every sample site, grouped by plan: what a Showcase, Lite, Full or contractor site looks like when it is built.',
};

const slug = (plan: string): string => `samples-${plan.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

/**
 * bohdiai.com/samples — every sample site, grouped by plan in the order the
 * plans are sold (Alex, 2026-10-06: one card per tier on the home page, "then a
 * link to other samples"). Each card opens the live sample in a new tab.
 */
export default function SamplesPage(): React.ReactElement {
  return (
    <Scene>
      <Header />
      <main id="main">
        <div className="px-2 pt-10 text-center md:pt-16">
          <SectionKicker>Samples</SectionKicker>
          <h1 className="mx-auto max-w-[900px] font-sans text-[34px] font-medium leading-[1.05] tracking-[-0.02em] text-text md:text-[60px] md:tracking-[-0.03em]">
            Every sample, <span className="animate-pulse-glow text-honey-warm">by plan</span>
          </h1>
          <p className="mt-5 inline-block rounded-pill border border-dashed border-honey-warm/30 px-3.5 py-1.5 text-[12px] text-muted md:text-[13px]">
            These are sample shops made to show range, not real businesses
          </p>
        </div>

        <div className="relative z-content mx-auto mt-14 flex max-w-[1180px] flex-col gap-16 px-5 md:mt-20 md:gap-24">
          {samplesByPlan().map(({ plan, samples }) => (
            <section key={plan} aria-labelledby={slug(plan)}>
              <h2 id={slug(plan)} className="mb-6 text-[12px] font-medium uppercase tracking-[0.2em] text-muted md:mb-8">
                {planName(plan)}
              </h2>
              <ul className="grid gap-8 md:grid-cols-3">
                {samples.map((s) => (
                  <li key={s.slug}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="group block text-left no-underline">
                      <div className="transition-transform duration-slow ease-out group-hover:-translate-y-1">
                        <WorkShot entry={s} sizes="(max-width: 768px) 100vw, 380px" />
                      </div>
                      <span className="mt-4 block font-sans text-[18px] font-medium tracking-[-0.01em] text-text">{s.name}</span>
                      <span className="text-[13px] text-muted">
                        {s.category} · {s.blurb}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <Contact />
      </main>
      <Footer />
    </Scene>
  );
}
