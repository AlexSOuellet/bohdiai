import { Scene } from '@/components/Scene';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Work } from '@/components/Work';
import { TradesMarquee } from '@/components/TradesMarquee';
import { HowItWorks } from '@/components/HowItWorks';
import { WhoBehind } from '@/components/WhoBehind';
import { Pledge } from '@/components/Pledge';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';

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
  founder: { '@type': 'Person', name: 'Alex Scott' },
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
        <Work />
        <TradesMarquee />
        <HowItWorks />
        <WhoBehind />
        <Pledge />
        <Contact />
      </main>
      <Footer />
    </Scene>
  );
}
