import type { Metadata } from 'next';
import { Scene } from '@/components/Scene';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { IntakeForm } from '@/components/intake/IntakeForm';
import { supabaseAdmin } from '@/lib/supabase';
import { getIntakeWords } from '@/lib/intake/queries';
import { FAMILIES, FAMILY_KEYS } from '@/lib/archetypes/main-street/families';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';

// The form's words live in the database and can change without a deploy.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const w = (await getIntakeWords(supabaseAdmin())).page;
  return { title: w.metaTitle, description: w.metaDescription };
}

/** bohdiai.com/start: a maker sends what we need to start their site. */
export default async function StartPage(): Promise<React.ReactElement> {
  const words = await getIntakeWords(supabaseAdmin());
  // Every family there is, now and later, each on its own background (makers see moods).
  const looks = FAMILY_KEYS.map((key) => ({ key, texture: FAMILIES[key].wallpaperUrl }));
  return (
    <Scene>
      <Header />
      <main id="main" className="relative z-content px-3 pb-20 pt-10 md:pb-28 md:pt-16">
        <h1 className="mx-auto max-w-[820px] text-center font-sans text-[34px] font-medium leading-[1.05] tracking-[-0.02em] text-text md:text-[56px] md:tracking-[-0.03em]">
          {words.page.title}
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-center text-[15px] leading-[1.6] text-text-soft md:text-[17px]">{words.page.lede}</p>
        <div className="mx-auto mt-12 max-w-[760px] md:mt-16">
          <IntakeForm words={words} looks={looks} contactEmail={SITE_CONTACT_EMAIL} />
        </div>
      </main>
      <Footer />
    </Scene>
  );
}
