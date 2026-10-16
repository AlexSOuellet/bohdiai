import type { Metadata } from 'next';
import { Scene } from '@/components/Scene';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { IntakeForm } from '@/components/intake/IntakeForm';
import { supabaseAdmin } from '@/lib/supabase';
import { getIntakeWords } from '@/lib/intake/queries';
import { INTAKE_MOODS, type IntakeMood } from '@/lib/intake/request';
import { FAMILIES, type FamilyKey } from '@/lib/archetypes/main-street/families';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';

// The form's words live in the database and can change without a deploy.
export const dynamic = 'force-dynamic';

/** Each feeling's family, for the texture its tile shows (mood is public, family internal). */
const MOOD_FAMILY: Record<IntakeMood, FamilyKey> = {
  cozy: 'cozy',
  rustic: 'rustic',
  dark: 'dark',
  elegant: 'luxury',
  cheerful: 'cheerful',
  modern: 'modern',
};

export async function generateMetadata(): Promise<Metadata> {
  const w = (await getIntakeWords(supabaseAdmin())).page;
  return { title: w.metaTitle, description: w.metaDescription };
}

/** bohdiai.com/start: a maker sends what we need to start their site. */
export default async function StartPage(): Promise<React.ReactElement> {
  const words = await getIntakeWords(supabaseAdmin());
  const textures = Object.fromEntries(INTAKE_MOODS.map((m) => [m, FAMILIES[MOOD_FAMILY[m]].wallpaperUrl])) as Record<IntakeMood, string>;
  return (
    <Scene>
      <Header />
      <main id="main" className="relative z-content px-3 pb-20 pt-10 md:pb-28 md:pt-16">
        <h1 className="mx-auto max-w-[820px] text-center font-sans text-[34px] font-medium leading-[1.05] tracking-[-0.02em] text-text md:text-[56px] md:tracking-[-0.03em]">
          {words.page.title}
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-center text-[15px] leading-[1.6] text-text-soft md:text-[17px]">{words.page.lede}</p>
        <div className="mx-auto mt-12 max-w-[760px] md:mt-16">
          <IntakeForm words={words} textures={textures} contactEmail={SITE_CONTACT_EMAIL} />
        </div>
      </main>
      <Footer />
    </Scene>
  );
}
