import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Scene } from '@/components/Scene';
import { IntakeForm } from '@/components/intake/IntakeForm';
import { supabaseAdmin } from '@/lib/supabase';
import { requireUser } from '@/lib/auth/session';
import { getIntakeWords } from '@/lib/intake/queries';
import { FAMILIES, FAMILY_KEYS } from '@/lib/archetypes/main-street/families';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { onboardingSite } from '@/lib/signup/onboarding';

// The form's words live in the database and can change without a deploy.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const w = (await getIntakeWords(supabaseAdmin())).page;
  return { title: w.metaTitle, description: w.metaDescription, robots: { index: false, follow: false } };
}

/**
 * app.bohdiai.com/welcome, onboarding (Alex, Session 119): straight after the
 * maker confirms their email, the site form, before anything else. Only for a
 * paid site that hasn't sent its form; anyone else goes to their backend.
 */
export default async function WelcomePage(): Promise<React.ReactElement> {
  const user = await requireUser();
  const site = await onboardingSite(supabaseAdmin(), user.id);
  if (site === null) redirect('/manage');
  const words = await getIntakeWords(supabaseAdmin());
  // Every family there is, now and later, each on its own background (makers see moods).
  const looks = FAMILY_KEYS.map((key) => ({ key, texture: FAMILIES[key].wallpaperUrl }));
  return (
    <Scene>
      <main id="main" className="relative z-content px-3 pb-20 pt-10 md:pb-28 md:pt-16">
        <h1 className="mx-auto max-w-[820px] text-center font-sans text-[34px] font-medium leading-[1.05] tracking-[-0.02em] text-text md:text-[56px] md:tracking-[-0.03em]">
          {words.page.title}
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-center text-[15px] leading-[1.6] text-text-soft md:text-[17px]">{words.page.lede}</p>
        <div className="mx-auto mt-12 max-w-[760px] md:mt-16">
          <IntakeForm words={words} looks={looks} contactEmail={SITE_CONTACT_EMAIL} />
        </div>
      </main>
    </Scene>
  );
}
