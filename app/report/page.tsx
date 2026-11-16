import type { Metadata } from 'next';
import { PlainPage } from '@/components/legal/PlainPage';
import { supabaseAdmin } from '@/lib/supabase';
import { getIntakeWords } from '@/lib/intake/queries';
import { siteName } from '@/lib/site-reports/report';
import { ReportForm } from './ReportForm';

// The words live in the database and can change without a deploy.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const w = (await getIntakeWords(supabaseAdmin())).report;
  return {
    title: w.metaTitle,
    description: w.metaDescription,
    robots: { index: false, follow: false },
  };
}

/** bohdiai.com/report: where "Report this site" in every site's footer goes (go-live
 *  step 3, Alex 2026-11-16). The link says which site; someone arriving without it
 *  types the address. */
export default async function ReportPage({
  searchParams,
}: PageProps<'/report'>): Promise<React.ReactElement> {
  const words = await getIntakeWords(supabaseAdmin());
  const raw = (await searchParams)['site'];
  const asked = siteName(typeof raw === 'string' ? raw : '');
  let known: { subdomain: string; name: string } | null = null;
  if (asked !== null) {
    const { data } = await supabaseAdmin()
      .from('tenants')
      .select('subdomain, business_name')
      .eq('subdomain', asked)
      .is('deleted_at', null)
      .maybeSingle();
    if (data !== null) known = { subdomain: data.subdomain, name: data.business_name };
  }
  return (
    <PlainPage title={words.report.title} back={words.report.back}>
      <ReportForm words={words.report} site={known} />
    </PlainPage>
  );
}
