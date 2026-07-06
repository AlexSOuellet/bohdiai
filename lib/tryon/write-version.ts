/**
 * Persist + read a try-on VERSION — a self-contained archetype envelope saved
 * against a tenant under a label. Unlike the live store, a version carries its
 * own products in the envelope, so it never writes to the shared listings table.
 */
import { supabaseAdmin } from '@/lib/supabase';

export interface VersionEnvelope {
  kind: 'archetype';
  archetypeKey: string;
  lookKey: string;
  mood: string;
  catalogSize: number;
  content: unknown;
  products: unknown[];
}

export async function writeVersion(tenantId: string, label: string, envelope: VersionEnvelope): Promise<void> {
  const { error } = await supabaseAdmin()
    .from('store_versions')
    .upsert({ tenant_id: tenantId, label, envelope: envelope as unknown as never }, { onConflict: 'tenant_id,label' });
  if (error) throw new Error(`writeVersion failed: ${error.message}`);
}

export async function readVersion(tenantId: string, label: string): Promise<VersionEnvelope | null> {
  const { data } = await supabaseAdmin()
    .from('store_versions')
    .select('envelope')
    .eq('tenant_id', tenantId)
    .eq('label', label)
    .maybeSingle();
  return (data?.envelope as VersionEnvelope | undefined) ?? null;
}
