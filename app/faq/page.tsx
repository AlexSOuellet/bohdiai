import type { Metadata } from 'next';
import { Scene } from '@/components/Scene';
import { Header } from '@/components/Header';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { SectionKicker } from '@/components/SectionKicker';
import { FaqList } from '@/components/faq/FaqList';
import { FAQ_GROUPS, faqItem, faqJsonLd } from '@/lib/site/faq';

export const metadata: Metadata = {
  title: 'FAQ — BohdiAI',
  description:
    'Why the prices are so low, when billing starts, who owns your site, and everything else people ask before they start.',
};

const LEAD_ID = 'why-so-low';
const slug = (title: string): string => `faq-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

export default function FaqPage(): React.ReactElement {
  const lead = faqItem(LEAD_ID);
  const groups = FAQ_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => i.id !== LEAD_ID) })).filter(
    (g) => g.items.length > 0,
  );
  return (
    <Scene>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }} />
      <Header />
      <main id="main">
        <div className="px-2 pt-10 text-center md:pt-16">
          <SectionKicker>FAQ</SectionKicker>
          <h1 className="mx-auto max-w-[900px] font-sans text-[34px] font-medium leading-[1.05] tracking-[-0.02em] text-text md:text-[60px] md:tracking-[-0.03em]">
            Questions, <span className="animate-pulse-glow text-honey-warm">answered straight</span>
          </h1>
        </div>

        <article
          id={lead.id}
          className="relative z-content mx-auto mt-12 max-w-[760px] scroll-mt-8 rounded-[22px] border border-honey-warm/35 p-6 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.85),0_0_80px_-24px_rgba(243,201,122,0.3)] [background:radial-gradient(120%_70%_at_100%_0%,rgba(243,201,122,0.14),transparent_60%),linear-gradient(180deg,rgba(32,24,16,0.92),rgba(12,9,6,0.85))] md:mt-16 md:p-10"
        >
          <h2 className="font-sans text-[24px] font-medium leading-[1.15] tracking-[-0.02em] text-honey-warm md:text-[32px]">
            {lead.q}
          </h2>
          <div className="mt-5 flex flex-col gap-4 text-[16px] leading-[1.7] text-text-soft md:text-[17px]">
            {lead.a.map((para, i) => (
              <p key={para} className={i === 0 ? 'font-sans text-[19px] font-medium text-text md:text-[21px]' : undefined}>
                {para}
              </p>
            ))}
          </div>
          <p className="mt-6 text-[14px] font-semibold text-honey-warm">— Alex</p>
        </article>

        <div className="relative z-content mx-auto mt-16 flex max-w-[760px] flex-col gap-12 px-3 md:mt-24 md:gap-16">
          {groups.map((g) => (
            <section key={g.title} aria-labelledby={slug(g.title)}>
              <h2
                id={slug(g.title)}
                className="mb-4 text-[12px] font-medium uppercase tracking-[0.2em] text-muted md:mb-5"
              >
                {g.title}
              </h2>
              <FaqList items={g.items} />
            </section>
          ))}
        </div>

        <Contact />
      </main>
      <Footer />
    </Scene>
  );
}
