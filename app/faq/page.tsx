import type { Metadata } from 'next';
import { Scene } from '@/components/Scene';
import { Header } from '@/components/Header';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { SectionKicker } from '@/components/SectionKicker';
import { FaqList } from '@/components/faq/FaqList';
import { FAQ_GROUPS, faqJsonLd } from '@/lib/site/faq';

export const metadata: Metadata = {
  title: 'FAQ — BohdiAI',
  description:
    'Why the prices are so low, when billing starts, who owns your site, and everything else people ask before they start.',
};

const slug = (title: string): string => `faq-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

export default function FaqPage(): React.ReactElement {
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


        <div className="relative z-content mx-auto mt-16 flex max-w-[760px] flex-col gap-12 px-3 md:mt-24 md:gap-16">
          {FAQ_GROUPS.map((g) => (
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
