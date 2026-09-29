import { SectionKicker } from './SectionKicker';
import { InquiryForm } from './InquiryForm';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';

// True however a project ends up priced — the numbers themselves come up in conversation.
const PROMISES = ['You’ll know the full price before I start', 'I never take a cut of your sales'] as const;

export function Contact(): React.ReactElement {
  return (
    <section id="contact" className="relative z-content px-3 py-16 md:py-24">
      <SectionKicker>Contact</SectionKicker>

      <h2 className="mx-auto max-w-[680px] px-3 text-center font-sans text-[30px] font-medium leading-[1.05] tracking-[-0.025em] text-text-soft md:text-[48px] md:tracking-[-0.03em]">
        Tell me about{' '}
        <em className="not-italic text-honey-warm [text-shadow:0_0_32px_rgba(243,201,122,0.5)]">your project</em>
      </h2>

      <ul className="mx-auto mt-6 flex max-w-[640px] flex-col items-center gap-2.5 md:flex-row md:justify-center md:gap-7">
        {PROMISES.map((p) => (
          <li key={p} className="inline-flex items-center gap-2.5 text-[14px] text-text-soft md:text-[15px]">
            <span className="size-1.5 rounded-full bg-honey shadow-[0_0_12px_var(--honey)]" />
            {p}
          </li>
        ))}
      </ul>

      <div className="relative mx-auto mt-9 max-w-[640px] rounded-[18px] border border-honey-warm/[0.18] p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7),0_0_60px_-20px_rgba(243,201,122,0.15)] backdrop-blur-[20px] [background:linear-gradient(180deg,rgba(26,20,16,0.85),rgba(10,8,5,0.75))] md:mt-11 md:rounded-[20px] md:p-8">
        <InquiryForm />
      </div>

      <p className="mt-6 text-center text-[13px] text-muted md:text-[14px]">
        Or email me at{' '}
        <a
          href={`mailto:${SITE_CONTACT_EMAIL}`}
          className="text-honey-warm underline decoration-honey-warm/40 underline-offset-4 hover:decoration-honey-warm"
        >
          {SITE_CONTACT_EMAIL}
        </a>
      </p>
    </section>
  );
}
