import type { Metadata } from 'next';
import { Scene } from '@/components/Scene';
import { Header } from '@/components/Header';
import { HowItWorks } from '@/components/HowItWorks';
import { TradesMarquee } from '@/components/TradesMarquee';
import { Work } from '@/components/Work';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { ArmHero, CompareSection, FaqSection, PlansSection } from '@/components/arms/ArmSections';
import { formatPrice, fromPrice } from '@/lib/site/plans';

export const metadata: Metadata = {
  title: 'Websites for contractors — BohdiAI',
  description:
    `A real web developer for less than a site builder. Built free, from ${formatPrice(fromPrice('contractor'))} a month, and every lead is yours alone.`,
  alternates: { canonical: 'https://service.bohdiai.com' },
  openGraph: { url: 'https://service.bohdiai.com' },
};

/**
 * service.bohdiai.com, the service arm (Alex, Session 107; the middleware shows
 * this page at the arm's `/`). Complete, and quiet until it is pushed.
 */
export default function ContractorsPage(): React.ReactElement {
  return (
    <Scene>
      <Header arm="service" />
      <main id="main">
        <ArmHero
          badge="Websites for contractors"
          title={['A real web developer', 'for less than a site builder']}
          sub="A site that brings in work. Customers send photos of the job, and the estimate request lands with you. Built free, and every lead is yours alone."
          primary={{ href: '#contact', label: 'Tell me about your business →' }}
          secondary={{ href: '#plans', label: 'See the plans' }}
        />
        <PlansSection audience="contractor" />
        <HowItWorks audience="contractor" />
        <TradesMarquee audience="contractor" />
        <CompareSection
          audience="contractor"
          sub="You can build it yourself at night, or pay for leads your competitors also get."
        />
        <FaqSection audience="contractor" />
        <Work audience="contractor" />
        <Contact audience="contractor" />
      </main>
      <Footer />
    </Scene>
  );
}
