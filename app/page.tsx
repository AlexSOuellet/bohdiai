import { Scene } from '@/components/Scene';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Doors } from '@/components/Doors';
import { Work } from '@/components/Work';
import { WhoBehind } from '@/components/WhoBehind';
import { Pledge } from '@/components/Pledge';
import { SomethingElse } from '@/components/SomethingElse';
import { Footer } from '@/components/Footer';
import { SITE_CONTACT_EMAIL, SITE_FACEBOOK_URL } from '@/lib/site/contact';

const SITE_URL = process.env['SITE_URL'] ?? 'https://bohdiai.com';

/** BohdiAI's own business schema. Lives here on the marketing home — NOT in
 *  the root layout, where it would leak onto every tenant storefront. */
const BUSINESS_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'BohdiAI',
  url: SITE_URL,
  description: 'Websites for makers, contractors and charities in Rhode Island and beyond.',
  email: SITE_CONTACT_EMAIL,
  sameAs: [SITE_FACEBOOK_URL],
  founder: { '@type': 'Person', name: 'Alex Ouellet' },
  areaServed: 'US',
  foundingDate: '2026',
};

export default function HomePage(): React.ReactElement {
  return (
    <Scene>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(BUSINESS_JSON_LD) }} />
      <Header />
      <main id="main">
        <Hero />
        <Doors />
        {/* The parent keeps the real clients, the story, the pledge and a box for anything else; the
            trades and how it works live on each arm (Alex, Session 108). */}
        <Work clientsOnly />
        <WhoBehind />
        <Pledge />
        <SomethingElse />
      </main>
      <Footer />
    </Scene>
  );
}
