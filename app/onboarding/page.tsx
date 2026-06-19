import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/auth/session';
import OnboardingFlow from './_components/OnboardingFlow';

export default async function OnboardingPage() {
  const enabled = await isFeatureEnabled('onboarding');
  if (!enabled) notFound();

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('niches')
    .select('slug, display_name')
    .eq('status', 'approved')
    .order('display_name');

  // A maker who is already logged in (returned from the Google round-trip, or
  // creating an additional shop) skips the account step and starts at step 2.
  const user = await getCurrentUser();
  const startStep = user ? 2 : 1;

  return <OnboardingFlow niches={data ?? []} startStep={startStep} />;
}
