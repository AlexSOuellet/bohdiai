import { Scene } from '@/components/Scene';
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
      <main id="main">
        <section className="py-20 text-center">
          <p className="text-honey-warm font-mono text-xs uppercase tracking-[0.16em]">
            Atmospheric shell — sections wiring in
          </p>
          <p className="mt-4 text-text-soft">
            Founder waitlist: {founderTakenCount}/{founderCap}
          </p>
        </section>
      </main>
    </Scene>
  );
}
