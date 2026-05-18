import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { Breadth } from '@/components/Breadth';
import { WhosBehindThis } from '@/components/WhosBehindThis';
import { Community } from '@/components/Community';
import { Waitlist } from '@/components/Waitlist';
import { Pledge } from '@/components/Pledge';
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

export default async function HomePage() {
  const [founderTakenCount, founderCap] = await Promise.all([
    getFounderTakenCount(),
    Promise.resolve(getFounderCap()),
  ]);

  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <HowItWorks />
        <Breadth />
        <WhosBehindThis />
        <Waitlist founderTakenCount={founderTakenCount} founderCap={founderCap} />
        <Community />
        <Pledge />
      </main>
      <Footer />
    </>
  );
}
