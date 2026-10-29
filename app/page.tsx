import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Scene } from '@/components/Scene';
import { Header } from '@/components/Header';
import { HowItWorks } from '@/components/HowItWorks';
import { WhoBehind } from '@/components/WhoBehind';
import { Pledge } from '@/components/Pledge';
import { Footer } from '@/components/Footer';
import { WorkBrowser } from '@/components/WorkBrowser';
import { ArmHero, CompareSection, FaqSection, LooksSection, PlansSection } from '@/components/arms/ArmSections';
import { PlanLadder } from '@/components/arms/PlanLadder';
import { CustomSites } from '@/components/arms/CustomSites';
import { MakerClose } from '@/components/arms/MakerClose';
import { SITE_CONTACT_EMAIL, SITE_FACEBOOK_URL } from '@/lib/site/contact';
import { formatPrice, fromPrice } from '@/lib/site/plans';

const SITE_URL = process.env['SITE_URL'] ?? 'https://bohdiai.com';

export const metadata: Metadata = {
  title: 'BohdiAI · Websites and tools for makers',
  description: `Your work online, the way you sell it: free tools to price your work, then a site from ${formatPrice(fromPrice('maker'))} a month. Be found, sell at your markets, sell online, and never a cut of your sales.`,
  alternates: { canonical: SITE_URL },
  openGraph: { url: SITE_URL },
};

/** BohdiAI's own business schema. Lives here on the marketing home — NOT in
 *  the root layout, where it would leak onto every tenant storefront. */
const BUSINESS_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'BohdiAI',
  url: SITE_URL,
  description: 'Websites and money tools for makers: the people who make things and sell them at markets and online.',
  email: SITE_CONTACT_EMAIL,
  sameAs: [SITE_FACEBOOK_URL],
  founder: { '@type': 'Person', name: 'Alex Ouellet' },
  areaServed: 'US',
  foundingDate: '2026',
};

/**
 * bohdiai.com is the maker site (Alex, Session 117): no doors, no service or
 * charities. The makers arm's pitch moved up here (makers.bohdiai.com and
 * service.bohdiai.com forward to it). The looks come first, right under the
 * opening; the plans are built up before they are priced, starting with Free;
 * Penny's custom shop sits with the custom sites, never as a standard plan.
 */
export default async function HomePage(): Promise<React.ReactElement> {
  const host = (await headers()).get('host') ?? '';
  return (
    <Scene>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(BUSINESS_JSON_LD) }} />
      <Header />
      <main id="main">
        <ArmHero
          badge="Websites for makers"
          title={['Your work online', 'the way you sell it']}
          sub="Know what each piece really earns, show what you make, tell people where to find you, take the sale at your market table, and sell online when you’re ready. Every dollar your customers pay goes straight to you."
          primary={{ href: '/start', label: 'Start your site →' }}
          secondary={{ href: '#ladder', label: 'See the plans' }}
        />
        {/* The one way in left for anyone else (Alex, Session 117), where the doors used to be. */}
        <p className="relative z-content mx-auto mt-5 max-w-[560px] px-4 text-center text-[14px] leading-[1.55] text-muted md:text-[15px]">
          Need a site for something other than making things?{' '}
          <a
            href="#contact"
            className="whitespace-nowrap text-honey-warm underline decoration-honey-warm/40 underline-offset-4 hover:decoration-honey-warm"
          >
            Send me a note
          </a>
        </p>
        <div className="px-2 text-center">
          <WorkBrowser />
        </div>
        <LooksSection local={host.includes('localhost')} />
        <PlanLadder />
        <HowItWorks audience="maker" />
        <PlansSection audience="maker" />
        <CompareSection
          audience="maker"
          sub="The cheap options make you do the work. The easy ones take a cut of every sale."
        />
        <CustomSites />
        <WhoBehind />
        <Pledge />
        <FaqSection audience="maker" />
        <MakerClose />
      </main>
      <Footer />
    </Scene>
  );
}
