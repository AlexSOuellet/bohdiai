import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { DesignTokensSchema, tokensToCssVars } from '@/lib/tokens';

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');

  let cssVars = '';

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
      }
    }
  }

  return (
    <>
      {cssVars !== '' && <style dangerouslySetInnerHTML={{ __html: cssVars }} />}
      <div className="min-h-screen bg-s-background text-s-text">{children}</div>
    </>
  );
}
