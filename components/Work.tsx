import { CLIENTS, LISTED_SAMPLES } from '@/lib/site/work';
import { ClientSlideshow } from './ClientSlideshow';
import { WorkShot } from './WorkShot';
import { SectionKicker } from './SectionKicker';
import type { Audience } from '@/lib/site/plans';

const AUDIENCE_CATEGORY: Record<Audience, string> = { maker: 'Maker', contractor: 'Contractor' };

const H2 =
  'mx-auto max-w-[780px] px-3 text-center font-sans text-[30px] font-medium leading-[1.05] tracking-[-0.025em] text-text-soft md:text-[48px] md:tracking-[-0.03em]';
const EM = 'not-italic text-honey-warm [text-shadow:0_0_32px_rgba(243,201,122,0.5)]';

// Fanned on wide screens: four cards spread evenly across the shelf, the outer two
// tilted out and dropped a little, each overlapping its neighbour only slightly so
// every name stays clear; hovering a card lifts and straightens it and dims the
// others. Stacks into one column on phones.
const FAN = [
  'md:-translate-x-[179%] md:translate-y-[34px] md:-rotate-[6deg] md:z-[1] md:hover:-translate-y-2 md:hover:-rotate-1',
  'md:-translate-x-[93%] md:translate-y-[6px] md:-rotate-[2deg] md:z-[2] md:hover:-translate-y-3 md:hover:rotate-0',
  'md:-translate-x-[7%] md:translate-y-[6px] md:rotate-[2deg] md:z-[3] md:hover:-translate-y-3 md:hover:rotate-0',
  'md:translate-x-[79%] md:translate-y-[34px] md:rotate-[6deg] md:z-[2] md:hover:-translate-y-2 md:hover:rotate-1',
] as const;

/** With an `audience`, only that audience's clients show (and the sample shops only for makers). */
export function Work({ audience }: { audience?: Audience } = {}): React.ReactElement {
  const clients =
    audience === undefined
      ? CLIENTS
      : CLIENTS.filter((c) => c.category === AUDIENCE_CATEGORY[audience]);
  const showSamples = audience !== 'contractor';
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
            {LISTED_SAMPLES.map((s, i) => (
              <a
                key={s.slug}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className={[
                  'block text-left no-underline transition-[transform,filter] duration-slow ease-out md:absolute md:left-1/2 md:top-0 md:w-[min(320px,25vw)] md:hover:z-[9] md:hover:scale-[1.04] md:hover:!brightness-100 md:group-hover/shelf:brightness-[0.55]',
                  FAN[i] ?? '',
                ].join(' ')}
              >
                <WorkShot entry={s} sizes="(max-width: 768px) 100vw, 320px" />
                <div className="mt-4 px-1.5">
                  {s.plan !== undefined && (
                    <span className="mb-1.5 inline-block rounded-pill border border-honey-warm/35 bg-honey-warm/[0.08] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-honey-warm">
                      {s.plan}
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
        </div>
      )}
    </section>
  );
}
