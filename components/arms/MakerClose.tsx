/**
 * How the makers arm ends (Alex, Session 108): an invite to start, straight to
 * the sign-up form, and under it a small box for questions and custom sites.
 * The service arm keeps the full "tell me about your project" form.
 */
import { SectionKicker } from '@/components/SectionKicker';
import { QuestionForm } from './QuestionForm';

export function MakerClose(): React.ReactElement {
  return (
    <section id="contact" aria-labelledby="close-title" className="relative z-content scroll-mt-20 px-3 py-20 md:py-28">
      <SectionKicker>Get started</SectionKicker>
      <h2
        id="close-title"
        className="mx-auto max-w-[680px] px-3 text-center font-sans text-[30px] font-medium leading-[1.05] tracking-[-0.025em] text-text-soft md:text-[48px] md:tracking-[-0.03em]"
      >
        Ready when{' '}
        <em className="not-italic text-honey-warm [text-shadow:0_0_32px_rgba(243,201,122,0.5)]">you are</em>
      </h2>
      <p className="mx-auto mt-4 max-w-[520px] text-center text-[15px] leading-[1.55] text-muted md:text-[16px]">
        Tell us about your work, see your site, and publish it when you’re happy.
      </p>
      <p className="mt-8 text-center">
        <a
          href="/start"
          className="inline-flex items-center justify-center gap-2 rounded-pill bg-honey-warm px-7 py-3.5 text-[15px] font-semibold text-bg no-underline shadow-[0_10px_40px_-10px_rgba(243,201,122,0.7)] transition-transform hover:-translate-y-px"
        >
          Start your site →
        </a>
      </p>

      <div className="relative mx-auto mt-16 max-w-[560px] rounded-[18px] border border-white/10 p-5 backdrop-blur-[20px] [background:linear-gradient(180deg,rgba(26,20,16,0.7),rgba(10,8,5,0.6))] md:mt-20 md:p-7">
        <h3 className="font-sans text-[18px] font-medium tracking-[-0.01em] text-text">Questions, or want a custom site?</h3>
        <p className="mb-5 mt-1.5 text-[14px] leading-[1.55] text-muted">Send me a note and I’ll write back within a couple of days.</p>
        <QuestionForm />
      </div>
    </section>
  );
}
