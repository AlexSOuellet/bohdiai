import { CLIENTS, LISTED_SAMPLES, planName, sampleAudience } from '@/lib/site/work';
import { ClientSlideshow } from './ClientSlideshow';
import { WorkShot } from './WorkShot';
import { SectionKicker } from './SectionKicker';
import type { Audience } from '@/lib/site/plans';

const AUDIENCE_CATEGORY: Record<Audience, string> = { maker: 'Maker', contractor: 'Contractor' };

const H2 =
  'mx-auto max-w-[780px] px-3 text-center font-sans text-[30px] font-medium leading-[1.05] tracking-[-0.025em] text-text-soft md:text-[48px] md:tracking-[-0.03em]';
const EM = 'not-italic text-honey-warm [text-shadow:0_0_32px_rgba(243,201,122,0.5)]';

// Fanned on wide screens: the cards spread evenly across the shelf, the outer ones
// tilted out and dropped a little, each overlapping its neighbour only slightly so
// every name stays clear; hovering a card lifts and straightens it and dims the
// others. Stacks into one column on phones. One spread per card count (the home
// page shows five, the maker page three, the contractor page two).
const FANS: Record<number, readonly string[]> = {
  2: [
    'md:-translate-x-[95%] md:translate-y-[6px] md:-rotate-[2deg] md:z-[1] md:hover:-translate-y-3 md:hover:rotate-0',
    'md:-translate-x-[5%] md:translate-y-[6px] md:rotate-[2deg] md:z-[2] md:hover:-translate-y-3 md:hover:rotate-0',
  ],
  3: [
    'md:-translate-x-[136%] md:translate-y-[22px] md:-rotate-[4deg] md:z-[1] md:hover:-translate-y-2 md:hover:-rotate-1',
    'md:-translate-x-[50%] md:translate-y-0 md:rotate-0 md:z-[3] md:hover:-translate-y-3',
    'md:translate-x-[36%] md:translate-y-[22px] md:rotate-[4deg] md:z-[2] md:hover:-translate-y-2 md:hover:rotate-1',
  ],
  4: [
    'md:-translate-x-[179%] md:translate-y-[34px] md:-rotate-[6deg] md:z-[1] md:hover:-translate-y-2 md:hover:-rotate-1',
    'md:-translate-x-[93%] md:translate-y-[6px] md:-rotate-[2deg] md:z-[2] md:hover:-translate-y-3 md:hover:rotate-0',
    'md:-translate-x-[7%] md:translate-y-[6px] md:rotate-[2deg] md:z-[3] md:hover:-translate-y-3 md:hover:rotate-0',
    'md:translate-x-[79%] md:translate-y-[34px] md:rotate-[6deg] md:z-[2] md:hover:-translate-y-2 md:hover:rotate-1',
  ],
  5: [
    'md:-translate-x-[210%] md:translate-y-[38px] md:-rotate-[6deg] md:z-[1] md:hover:-translate-y-2 md:hover:-rotate-1',
    'md:-translate-x-[130%] md:translate-y-[12px] md:-rotate-[3deg] md:z-[2] md:hover:-translate-y-3 md:hover:rotate-0',
    'md:-translate-x-[50%] md:translate-y-0 md:rotate-0 md:z-[3] md:hover:-translate-y-3',
    'md:translate-x-[30%] md:translate-y-[12px] md:rotate-[3deg] md:z-[2] md:hover:-translate-y-3 md:hover:rotate-0',
    'md:translate-x-[110%] md:translate-y-[38px] md:rotate-[6deg] md:z-[1] md:hover:-translate-y-2 md:hover:rotate-1',
  ],
};

/** With an `audience`, only that audience's clients and samples show. */
export function Work({ audience }: { audience?: Audience } = {}): React.ReactElement {
  const clients =
    audience === undefined
      ? CLIENTS
      : CLIENTS.filter((c) => c.category === AUDIENCE_CATEGORY[audience]);
  const samples = audience === undefined ? LISTED_SAMPLES : LISTED_SAMPLES.filter((s) => sampleAudience(s) === audience);
  const fan = FANS[samples.length] ?? [];
  const fanWidth = samples.length >= 5 ? 'md:w-[min(270px,19vw)]' : 'md:w-[min(320px,25vw)]';
  const showSamples = samples.length > 0;
  return (
    <section
      id="work"
      className="relative z-content mx-auto max-w-[1180px] px-5 pb-10 pt-24 md:pt-36"
    >
      <SectionKicker>The work</SectionKicker>
      <h2 className={H2}>
        Real sites for <em className={EM}>real businesses</em>
      </h2>
      <p className="mx-auto mt-4 max-w-[560px] text-center text-[15px] leading-[1.55] text-muted md:text-[16px]">
        Every one is different, because every business is. Here’s who I’ve built for so far.
      </p>

      <ClientSlideshow clients={clients} />

      {showSamples && (
        <div className="mt-28 text-center md:mt-40">
          <SectionKicker>Samples</SectionKicker>
          <h2 className={H2}>
            A few <em className={EM}>looks</em> to get you thinking
          </h2>
          <p className="mt-4 inline-block rounded-pill border border-dashed border-honey-warm/30 px-3.5 py-1.5 text-[12px] text-muted md:text-[13px]">
            These are sample shops made to show range, not real businesses
          </p>

          <div className="group/shelf relative mt-12 grid gap-10 md:mt-14 md:block md:h-[300px]">
            {samples.map((s, i) => (
              <a
                key={s.slug}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className={[
                  'block text-left no-underline transition-[transform,filter] duration-slow ease-out md:absolute md:left-1/2 md:top-0 md:hover:z-[9] md:hover:scale-[1.04] md:hover:!brightness-100 md:group-hover/shelf:brightness-[0.55]',
                  fanWidth,
                  fan[i] ?? '',
                ].join(' ')}
              >
                <WorkShot entry={s} sizes="(max-width: 768px) 100vw, 320px" />
                <div className="mt-4 px-1.5">
                  {s.plan !== undefined && (
                    <span className="mb-1.5 inline-block rounded-pill border border-honey-warm/35 bg-honey-warm/[0.08] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-honey-warm">
                      {planName(s.plan)}
                    </span>
                  )}
                  <span className="block font-sans text-[18px] font-medium tracking-[-0.01em] text-text">
                    {s.name}
                  </span>
                  <span className="text-[13px] text-muted">
                    {s.category} · {s.blurb}
                  </span>
                </div>
              </a>
            ))}
          </div>
          <a
            href="/samples"
            className="relative z-content mt-12 inline-flex items-center gap-2 border-b border-honey-warm/35 pb-0.5 text-[14px] font-semibold text-honey-warm no-underline transition-colors hover:border-honey-warm md:mt-20"
          >
            See more samples →
          </a>
        </div>
      )}
    </section>
  );
}
