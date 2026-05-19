import { Scene } from '@/components/Scene';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { TradesMarquee } from '@/components/TradesMarquee';
import { WhoBehind } from '@/components/WhoBehind';
import { Pledge } from '@/components/Pledge';
import { Community } from '@/components/Community';
import { Footer } from '@/components/Footer';
import { supabaseAdmin } from '@/lib/supabase';
import { serverEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

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
      <Header />
      <main id="main">
        <Hero />
        <HowItWorks />
        <TradesMarquee />
        <section className="py-8 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">
            Founder waitlist: {founderTakenCount}/{founderCap} · still wiring in: Waitlist ·
            BrowserDemo
          </p>
        </section>
        <WhoBehind />
        <Pledge />
        <Community />
      </main>
      <Footer />
    </Scene>
  );
}
