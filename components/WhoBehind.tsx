import Image from 'next/image';
import { SectionKicker } from './SectionKicker';

export function WhoBehind(): React.ReactElement {
  return (
    <section id="who" className="relative z-content px-3 py-14 md:py-24">
      <SectionKicker>Who&apos;s behind this</SectionKicker>

      <div className="mx-auto mt-8 grid max-w-[1020px] grid-cols-1 items-center gap-6 md:mt-12 md:grid-cols-[0.85fr_1fr] md:gap-14">
        {/* Portrait — honey bokeh glow, then feathered radial mask on the image */}
        <div className="portrait-bokeh relative mx-auto aspect-[4/5] w-[72%] overflow-hidden md:w-full">
          <Image
            src="/alex-portrait.png"
            alt="Alex Scott, founder of BohdiAI"
            fill
            sizes="(max-width: 720px) 72vw, 40vw"
            className="portrait-mask relative z-raised object-cover object-[50%_30%]"
            priority={false}
          />
        </div>

        <div className="relative px-1.5 text-center md:px-0 md:text-left">
          <span
            aria-hidden="true"
            className="block font-serif text-[72px] italic font-medium leading-[0.5] text-honey-warm [text-shadow:0_0_24px_rgba(243,201,122,0.4)] mb-1 md:text-[96px] md:mb-2"
          >
            &ldquo;
          </span>
          <p className="font-sans text-[18px] font-normal leading-[1.5] tracking-[-0.012em] text-text-soft md:text-[24px] md:leading-[1.45]">
            I&apos;ve spent 30 years helping people figure out the tech they were afraid of. In the
            90s it was{' '}
            <em className="not-italic font-medium text-honey-warm">home computers</em>. Today
            it&apos;s <em className="not-italic font-medium text-honey-warm">AI</em>. The fear
            hasn&apos;t changed — just the decade.
            <span className="mt-3 block md:mt-3.5">
              I built BohdiAI because helping people take that first step is what I&apos;ve always
              done. And I&apos;m not stopping now.
            </span>
          </p>
          <div className="mt-5 flex items-center justify-center gap-3.5 md:mt-8 md:justify-start">
            <span className="h-px w-6 bg-honey-warm/50 md:w-9" />
            <span className="font-sans text-[14px] font-semibold tracking-[-0.005em] text-text md:text-[15px]">
              Alex Scott
            </span>
            <span className="ml-1.5 text-[12px] text-muted md:text-[13px]">Founder, BohdiAI</span>
          </div>
        </div>
      </div>
    </section>
  );
}
