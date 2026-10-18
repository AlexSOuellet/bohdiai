import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Scene } from '@/components/Scene';
import { Header } from '@/components/Header';
import { HowItWorks } from '@/components/HowItWorks';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { ArmHero, CompareSection, FaqSection, LooksSection, PlansSection } from '@/components/arms/ArmSections';
import { PlanLadder } from '@/components/arms/PlanLadder';
import { CustomSites } from '@/components/arms/CustomSites';
import { formatPrice, fromPrice } from '@/lib/site/plans';

export const metadata: Metadata = {
  title: 'Websites for makers — BohdiAI',
  description:
    `Your work online, the way you sell it: be found, sell at your markets, sell online. From ${formatPrice(fromPrice('maker'))} a month, and never a cut of your sales.`,
  alternates: { canonical: 'https://makers.bohdiai.com' },
  openGraph: { url: 'https://makers.bohdiai.com' },
};

/**
 * makers.bohdiai.com, the makers arm (Alex, Session 107; the middleware shows
 * this page at the arm's `/`). The looks come first, right under the opening;
 * the plans are built up before they are priced; Penny's custom shop sits with
 * the custom sites, never as a standard plan (Alex, Session 108).
 */
export default async function MakersPage(): Promise<React.ReactElement> {
  const host = (await headers()).get('host') ?? '';
  return (
    <Scene>
      <Header arm="makers" />
      <main id="main">
        <ArmHero
          badge="Websites for makers"
          title={['Your work online', 'the way you sell it']}
          sub="Show what you make, tell people where to find you, take the sale at your market table, and sell online when you’re ready. Every dollar your customers pay goes straight to you."
          primary={{ href: '/start', label: 'Start your site →' }}
          secondary={{ href: '#ladder', label: 'See the plans' }}
        />
        <LooksSection local={host.includes('localhost')} />
        <PlanLadder />
        <HowItWorks audience="maker" />
        <PlansSection audience="maker" />
        <CompareSection
          audience="maker"
          sub="The cheap options make you do the work. The easy ones take a cut of every sale."
        />
        <CustomSites />
        <FaqSection audience="maker" />
        <Contact audience="maker" />
      </main>
      <Footer />
    </Scene>
  );
}
