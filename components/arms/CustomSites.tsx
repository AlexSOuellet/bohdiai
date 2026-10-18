/**
 * Custom sites on the makers arm (Alex, Session 108): made by hand for one
 * business, a paid option with no set price yet, so the section ends in the
 * form. Penny's shop is the example; it is custom, so it never stands in for
 * what a standard plan looks like.
 */
import { SectionKicker } from '@/components/SectionKicker';
import { ClientSlideshow } from '@/components/ClientSlideshow';
import { CLIENTS } from '@/lib/site/work';

const CUSTOM_EXAMPLES = CLIENTS.filter((c) => c.slug === 'decodigitaldesigns');

export function CustomSites(): React.ReactElement {
  return (
    <section id="custom" aria-labelledby="custom-title" className="relative z-content mx-auto max-w-[1180px] scroll-mt-20 px-5 pt-24 md:pt-36">
      <SectionKicker>Custom sites</SectionKicker>
      <h2
        id="custom-title"
        className="mx-auto max-w-[780px] px-3 text-center font-sans text-[30px] font-medium leading-[1.05] tracking-[-0.025em] text-text-soft md:text-[48px] md:tracking-[-0.03em]"
      >
        When you want something{' '}
        <em className="not-italic text-honey-warm [text-shadow:0_0_32px_rgba(243,201,122,0.5)]">all your own</em>
      </h2>
      <p className="mx-auto mt-4 max-w-[580px] text-center text-[15px] leading-[1.55] text-muted md:text-[16px]">
        A custom site is made by hand for one business, with touches no standard site has. Penny’s decoupage shop is one.
        Tell me what you have in mind and we’ll talk it through.
      </p>

      <ClientSlideshow clients={CUSTOM_EXAMPLES} />

      <p className="mt-10 text-center">
        <a
          href="#contact"
          className="inline-flex items-center justify-center gap-2 rounded-pill bg-text px-5 py-3 text-[14px] font-semibold text-bg no-underline md:px-6"
        >
          Tell me what you want →
        </a>
      </p>
    </section>
  );
}
