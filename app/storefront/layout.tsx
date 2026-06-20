import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { DesignTokensSchema, tokensToCssVars } from '@/lib/tokens';
import SmoothScroll from '@/components/storefront/motion/SmoothScroll';
import { storefrontSeoFacts } from '@/lib/storefront/metadata';
import { tenantBusinessJsonLd } from '@/lib/storefront/seo';

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');

  // Identify the shop as ITSELF (LocalBusiness/Store) to search engines — this
  // replaces the BohdiAI Organization schema that used to leak onto every page.
  const seoFacts = await storefrontSeoFacts();
  const businessJsonLd = seoFacts === null ? null : tenantBusinessJsonLd(seoFacts);

  let cssVars = '';
  let wordmarkTreatment: 'solid' | 'gradient' | 'outline' | 'two-tone' = 'solid';

  if (tenantId !== null) {
    const db = supabaseAdmin();
    const { data } = await db
      .from('design_tokens')
      .select('tokens')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single();

    if (data?.tokens !== null && data?.tokens !== undefined) {
      const parsed = DesignTokensSchema.safeParse(data.tokens);
      if (parsed.success) {
        cssVars = tokensToCssVars(parsed.data);
        wordmarkTreatment = parsed.data.wordmark.treatment;
      }
    }
  }

  return (
    <>
      {businessJsonLd !== null && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
        />
      )}
      {cssVars !== '' && <style dangerouslySetInnerHTML={{ __html: cssVars }} />}
      <SmoothScroll />
      <div
        className="min-h-screen bg-s-background text-s-text"
        data-wordmark-treatment={wordmarkTreatment}
      >
        {children}
      </div>
    </>
  );
}
