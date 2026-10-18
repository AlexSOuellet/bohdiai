import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Scene } from '@/components/Scene';
import { Header } from '@/components/Header';
import { HowItWorks } from '@/components/HowItWorks';
import { TradesMarquee } from '@/components/TradesMarquee';
import { Work } from '@/components/Work';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { ArmHero, CompareSection, FaqSection, LooksSection, PlansSection } from '@/components/arms/ArmSections';
import { formatPrice, fromPrice } from '@/lib/site/plans';

export const metadata: Metadata = {
  title: 'Websites for makers — BohdiAI',
  description:
    `A real web developer for less than a site builder. Built free, from ${formatPrice(fromPrice('maker'))} a month, and never a cut of your sales.`,
  alternates: { canonical: 'https://makers.bohdiai.com' },
  openGraph: { url: 'https://makers.bohdiai.com' },
};

/**
 * makers.bohdiai.com, the makers arm (Alex, Session 107; the middleware shows
 * this page at the arm's `/`). The looks come first, right under the opening.
 */
export default async function MakersPage(): Promise<React.ReactElement> {
  const host = (await headers()).get('host') ?? '';
  return (
    <Scene>
      <Header arm="makers" />
      <main id="main">
        <ArmHero
          badge="Websites for makers"
          sub="A site that shows what you make, tells people where to find you, and sells online when you’re ready. Built free, and every dollar your customers pay goes straight to you."
          primary={{ href: '/start', label: 'Start your site →' }}
          secondary={{ href: '#plans', label: 'See the plans' }}
        />
        <LooksSection local={host.includes('localhost')} />
        <HowItWorks audience="maker" />
        <TradesMarquee audience="maker" />
        <Work audience="maker" />
        <PlansSection audience="maker" />
        <CompareSection
          audience="maker"
          sub="The cheap options make you do the work. The easy ones take a cut of every sale."
        />
        <FaqSection audience="maker" />
        <Contact audience="maker" />
      </main>
      <Footer />
    </Scene>
  );
}
