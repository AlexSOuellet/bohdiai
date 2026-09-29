import Image from 'next/image';
import { SectionKicker } from './SectionKicker';

export function WhoBehind(): React.ReactElement {
  return (
    <section id="who" className="relative z-content px-3 py-14 md:py-24">
      <SectionKicker>Who&apos;s behind this</SectionKicker>

      <div className="mx-auto mt-8 grid max-w-[1020px] grid-cols-1 items-center gap-6 md:items-start md:mt-12 md:grid-cols-[0.85fr_1fr] md:gap-14">
        {/* Portrait — honey bokeh glow, then feathered radial mask on the image */}
        <div className="portrait-bokeh relative mx-auto aspect-[4/5] w-[72%] overflow-hidden md:sticky md:top-20 md:w-full">
          <Image
            src="/alex-portrait.png"
            alt="Alex, founder of BohdiAI"
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
            For more than 30 years I was an{' '}
            <em className="not-italic font-medium text-honey-warm">IT trainer</em>. I stood in front of
            rooms full of people who were sure they couldn&apos;t learn the thing in front of them, and
            watched them walk out doing it.
          </p>
          <p className="mt-4 text-[15px] leading-[1.65] text-muted md:mt-5 md:text-[17px]">
            When I retired, I found out I wasn&apos;t finished. The part I loved was never the
            technology. It was the moment someone realizes they can. These days I put that to work for
            small businesses: the maker at the craft fair, the crew laying sod, the volunteers keeping a
            good cause going.
          </p>

          <div className="mt-6 rounded-[14px] border border-honey-warm/[0.16] bg-honey-warm/[0.04] px-5 py-4 text-left md:mt-7 md:px-6 md:py-5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-honey-warm">
              The Bohdi Way
            </span>
            <p className="mt-2 text-[15px] leading-[1.65] text-text-soft md:text-[16px]">
              I make the hard parts easy, but I never take your business out of your hands. You own your
              site, your customers and every dollar you earn. I&apos;ll be straight with you about what a
              website can do, and about the part only you can do. Then I build something you&apos;re
              proud to send people to.
            </p>
          </div>
          <div className="mt-5 flex items-center justify-center gap-3.5 md:mt-8 md:justify-start">
            <span className="h-px w-6 bg-honey-warm/50 md:w-9" />
            <span className="font-sans text-[14px] font-semibold tracking-[-0.005em] text-text md:text-[15px]">
              Alex
            </span>
            <span className="ml-1.5 text-[12px] text-muted md:text-[13px]">Founder, BohdiAI</span>
          </div>
        </div>
      </div>
    </section>
  );
}
