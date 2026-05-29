import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { loadLegalMarkdown, renderLegalHtml, type LegalDoc } from '@/lib/legal';
import { loadStorefrontChromeBlocks } from './storefront-chrome';

interface LegalPageProps {
  doc: LegalDoc;
}

export default async function LegalPage({ doc }: LegalPageProps) {
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');
  if (tenantId === null) notFound();

  const { data: tenant } = await supabaseAdmin()
    .from('tenants')
    .select('business_name, contact_email, created_at')
    .eq('id', tenantId)
    .single();

  if (tenant === null) notFound();

  const shopName = tenant.business_name;
  const contactEmail = tenant.contact_email ?? 'hello@example.com';
  const lastUpdated = tenant.created_at.slice(0, 10);

  const { nav, footer } = await loadStorefrontChromeBlocks(tenantId);

  const markdown = await loadLegalMarkdown(doc, { shopName, contactEmail, lastUpdated });
  const html = renderLegalHtml(markdown);

  return (
    <>
      {nav}
      <main className="pt-24 md:pt-28 pb-16">
        <article
          className="max-w-2xl mx-auto px-6 font-s-body text-s-text/80 [&_h1]:font-s-heading [&_h1]:text-3xl [&_h1]:md:text-4xl [&_h1]:text-s-text [&_h1]:mb-4 [&_h2]:font-s-heading [&_h2]:text-xl [&_h2]:md:text-2xl [&_h2]:text-s-text [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:leading-relaxed [&_p]:mb-4 [&_a]:text-s-accent [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-s-text [&_strong]:text-s-text [&_em]:italic"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>
      {footer}
    </>
  );
}
