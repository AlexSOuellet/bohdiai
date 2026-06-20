import { Scene } from '@/components/Scene';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { TradesMarquee } from '@/components/TradesMarquee';
import { Waitlist } from '@/components/Waitlist';
import { WhoBehind } from '@/components/WhoBehind';
import { Pledge } from '@/components/Pledge';
import { Community } from '@/components/Community';
import { Footer } from '@/components/Footer';
import { supabaseAdmin } from '@/lib/supabase';
import { serverEnv } from '@/lib/env';

export const revalidate = 30;

const SITE_URL = process.env['SITE_URL'] ?? 'https://bohdiai.com';

/** BohdiAI's own Organization schema. Lives here on the marketing home — NOT in
 *  the root layout, where it used to leak onto every tenant storefront. */
const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'BohdiAI',
  url: SITE_URL,
  description:
    'AI-powered storefronts for small business owners — makers, bakers, vintage sellers, service providers, farm stands and more.',
  foundingDate: '2026',
};

async function getFounderTakenCount(): Promise<number> {
  try {
    const supabase = supabaseAdmin();
    const { count, error } = await supabase
      .from('waitlist')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'founder');
    if (error) {
      console.error('founder count error', error.message);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.error('founder count fatal', err);
    return 0;
  }
}

function getFounderCap(): number {
  try {
    return serverEnv().FOUNDER_CAP;
  } catch {
    return 25;
  }
}

export default async function HomePage(): Promise<React.ReactElement> {
  const [founderTakenCount, founderCap] = await Promise.all([
    getFounderTakenCount(),
    Promise.resolve(getFounderCap()),
  ]);

  return (
    <Scene>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
      />
      <Header />
      <main id="main">
        <Hero />
        <HowItWorks />
        <TradesMarquee />
        <Waitlist founderTakenCount={founderTakenCount} founderCap={founderCap} />
        <WhoBehind />
        <Pledge />
        <Community />
      </main>
      <Footer />
    </Scene>
  );
}
