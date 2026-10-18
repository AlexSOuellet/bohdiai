/**
 * The end of the parent page (Alex, Session 108). The doors do the sorting, so
 * the parent only needs a way in for whoever fits neither: a charity, a group,
 * something else. It wears the site's own section voice (the glowing headline,
 * the lit glass panel) so the page ends on a door of its own, not a settings box.
 * The charity line under the doors points here.
 */
import { SectionKicker } from './SectionKicker';
import { QuestionForm } from './arms/QuestionForm';

export function SomethingElse(): React.ReactElement {
  return (
    <section id="contact" aria-labelledby="something-else-title" className="relative z-content scroll-mt-20 px-3 py-16 md:py-24">
      <SectionKicker>Contact</SectionKicker>
      <h2
        id="something-else-title"
        className="mx-auto max-w-[720px] px-3 text-center font-sans text-[30px] font-medium leading-[1.05] tracking-[-0.025em] text-text-soft md:text-[48px] md:tracking-[-0.03em]"
      >
        Need{' '}
        <em className="not-italic text-honey-warm [text-shadow:0_0_32px_rgba(243,201,122,0.5)]">something else</em>
      </h2>
      <p className="mx-auto mt-4 max-w-[540px] px-3 text-center text-[15px] leading-[1.55] text-muted md:text-[16px]">
        A charity, a community group, or something that fits neither door. Send me a note and I’ll write back within a
        couple of days.
      </p>

      <div className="relative mx-auto mt-9 max-w-[640px] rounded-[18px] border border-honey-warm/[0.18] p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7),0_0_60px_-20px_rgba(243,201,122,0.15)] backdrop-blur-[20px] [background:linear-gradient(180deg,rgba(26,20,16,0.85),rgba(10,8,5,0.75))] md:mt-11 md:rounded-[20px] md:p-8">
        <QuestionForm kind="other" lit />
      </div>
    </section>
  );
}
