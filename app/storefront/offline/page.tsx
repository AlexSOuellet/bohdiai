import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { loadShopWords } from '@/lib/storefront/metadata';
import { renderArchetypeContentPage } from '../_components/StorefrontPage';

/**
 * What every visitor sees while the maker has their site offline (Alex, Session
 * 119): that it's temporarily offline and to check back later, in the site's own
 * look, in the site's own words. The router sends every page of an offline site
 * here; the maker, following their private link, still sees the real site.
 */
export const dynamic = 'force-dynamic';

/** The offline site's id; any other site's /offline is simply not a page. */
async function tenantId(): Promise<string> {
  const id = (await headers()).get('x-tenant-id');
  if (id === null) notFound();
  const { data } = await supabaseAdmin().from('tenants').select('status').eq('id', id).maybeSingle();
  if (data?.status !== 'offline') notFound();
  return id;
}

export async function generateMetadata(): Promise<Metadata> {
  const words = await loadShopWords(await tenantId());
  return { title: words.offline.title, robots: { index: false, follow: false } };
}

export default async function OfflinePage(): Promise<React.ReactElement> {
  const id = await tenantId();
  const words = await loadShopWords(id);
  const page = await renderArchetypeContentPage(id, { title: words.offline.title, body: [words.offline.body] });
  if (page !== null) return page;
  // A design without a content page still says so, plainly.
  return (
    <main id="main" className="mx-auto max-w-[36rem] px-6 py-24 text-center">
      <h1 className="text-[28px] font-semibold">{words.offline.title}</h1>
      <p className="mt-3 text-[16px] leading-[1.6]">{words.offline.body}</p>
    </main>
  );
}
