import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { loadLegalMarkdown, renderLegalHtml, type LegalDoc } from '@/lib/legal';
import { renderArchetypeContentPage } from './StorefrontPage';

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

  const markdown = await loadLegalMarkdown(doc, { shopName, contactEmail, lastUpdated });
  const html = renderLegalHtml(markdown);

  const page = await renderArchetypeContentPage(tenantId, { html });
  if (page === null) notFound();
  return page;
}
