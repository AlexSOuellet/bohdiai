import Image from 'next/image';
import type { WriteUp } from '@/lib/checkup/schemas';
import { NewsletterSignup } from './NewsletterSignup';
import { OfferCards } from './OfferCards';

type Path = WriteUp['paths'][number];
type PathGroup = Path['group'];
const GROUPS: ReadonlyArray<{ group: PathGroup; title: string }> = [
  { group: 'better', title: 'Do more with what you already have' },
  { group: 'bigger', title: 'When you’re ready to grow' },
  { group: 'mindset', title: 'How to think about it' },
];

const STEP_LABELS = ['This week', 'After that'] as const;

/** Alex's write-up: what he sees, where to start, then every path that fits. */
export function Results({ writeUp, onRestart }: { writeUp: WriteUp; onRestart: () => void }): React.ReactElement {
  const { summary, paths, first_steps: firstSteps, help_intro: helpIntro, help } = writeUp;

  return (
    <article className="checkup-screen mx-auto w-full max-w-[720px] pb-20">
      <header className="flex items-center gap-4">
        <div className="relative size-16 flex-none overflow-hidden rounded-full border border-honey/40 md:size-20">
          <Image src="/alex-portrait.png" alt="Alex" fill sizes="80px" loading="eager" className="object-cover object-[50%_25%]" />
        </div>
        <p className="checkup-hand text-[26px] leading-none text-honey-warm md:text-[30px]">Here’s what I see</p>
      </header>

      <div className="mt-8 flex flex-col gap-3">
        {summary.map((line) => (
          <p key={line} className="text-[21px] leading-[1.4] tracking-[-0.012em] text-text md:text-[25px]">
            {line}
          </p>
        ))}
      </div>

      {firstSteps.length > 0 && (
        <section aria-labelledby="checkup-start" className="mt-12">
          <h2 id="checkup-start" className="text-[28px] font-medium tracking-[-0.02em] text-text md:text-[34px]">
            Where to start
          </h2>
          <div className="mt-5 flex flex-col gap-4">
            {firstSteps.map((step, i) => (
              <div key={step} className="border-l-2 border-honey pl-5">
                <p className="checkup-hand text-[22px] leading-none text-honey-warm">{STEP_LABELS[i]}</p>
                <p className="mt-1.5 text-[18px] leading-[1.5] text-text-soft">{step}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {GROUPS.map(({ group, title }) => {
        const inGroup = paths.filter((p) => p.group === group);
        if (inGroup.length === 0) return null;
        return (
          <section key={group} aria-labelledby={`checkup-${group}`} className="mt-16">
            <h2 id={`checkup-${group}`} className="text-[28px] font-medium tracking-[-0.02em] text-text md:text-[34px]">
              {title}
            </h2>
            <div className="mt-6 flex flex-col gap-10">
              {inGroup.map((p) => (
                <PathBlock key={p.title} path={p} />
              ))}
            </div>
          </section>
        );
      })}

      {help.length > 0 && (
        <section aria-labelledby="checkup-help" className="mt-20 border-t border-text/10 pt-10">
          <h2 id="checkup-help" className="text-[28px] font-medium tracking-[-0.02em] text-text md:text-[34px]">
            How I can help
          </h2>
          {helpIntro !== '' && (
            <p className="mt-4 max-w-[620px] text-[18px] leading-[1.6] text-text-soft">{helpIntro}</p>
          )}
          <div className="mt-8">
            <OfferCards help={help} />
          </div>
        </section>
      )}

      <section aria-labelledby="checkup-tips" className="mt-20 border-t border-text/10 pt-10">
        <h2 id="checkup-tips" className="text-[28px] font-medium tracking-[-0.02em] text-text md:text-[34px]">
          Free tips and tricks
        </h2>
        <p className="mt-3 mb-6 max-w-[560px] text-[17px] leading-[1.6] text-text-soft">
          Every idea in this write-up goes deeper in my free tips: pricing, markets, getting started on Etsy, getting
          found. The business side of making, in plain English, straight to your inbox. No spam, and leave whenever
          you like.
        </p>
        <NewsletterSignup />
      </section>

      <footer className="mt-16 flex flex-col items-start gap-6">
        <p className="checkup-hand text-[34px] leading-none text-honey-warm">Alex</p>
        <button
          type="button"
          onClick={onRestart}
          className="text-[15px] text-muted underline decoration-muted/40 underline-offset-4 hover:text-text"
        >
          Start over with different answers
        </button>
      </footer>
    </article>
  );
}

function PathBlock({ path }: { path: Path }): React.ReactElement {
  return (
    <div>
      <h3 className="text-[22px] font-semibold leading-[1.2] tracking-[-0.015em] text-honey-warm md:text-[24px]">
        {path.title}
      </h3>
      <div className="mt-3 flex flex-col gap-3">
        {path.body.map((para) => (
          <p key={para} className="text-[17px] leading-[1.65] text-text-soft">
            {para}
          </p>
        ))}
      </div>
      <p className="mt-4 rounded-md bg-honey/[0.07] px-4 py-3 text-[16px] leading-[1.55] text-text">
        <span className="font-semibold text-honey-warm">Try this: </span>
        {path.step}
      </p>
    </div>
  );
}
