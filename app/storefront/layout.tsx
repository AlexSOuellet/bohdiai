import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { DesignTokensSchema, tokensToCssVars } from '@/lib/tokens';
import SmoothScroll from '@/components/storefront/motion/SmoothScroll';

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');

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
