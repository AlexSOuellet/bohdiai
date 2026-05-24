import { createSupabaseServerClient } from '@/lib/supabase-server';
import OnboardingFlow from './_components/OnboardingFlow';

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('niches')
    .select('slug, display_name')
    .eq('status', 'approved')
    .order('display_name');

  return <OnboardingFlow niches={data ?? []} />;
}
