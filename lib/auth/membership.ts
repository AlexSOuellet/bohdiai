// Shop membership helpers. A person's roles live per shop on the tenant_members
// bridge (D59 — one global login, roles per shop). These wrap the reads and the
// one write the onboarding/ownership seam needs, using the service-role client.

import { supabaseAdmin } from '@/lib/supabase';

export interface ShopSummary {
  tenantId: string;
  subdomain: string;
  businessName: string;
}

/**
 * Make `userId` an active admin (owner) of `tenantId`. Idempotent: if an active
 * membership already exists for this pair, it does nothing. Called at store
 * publish so every later "are you the owner of this shop?" check has a row.
 */
export async function addShopOwner(userId: string, tenantId: string): Promise<void> {
  const admin = supabaseAdmin();

  const { data: existing, error: selErr } = await admin
    .from('tenant_members')
    .select('id, role')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .maybeSingle();

  if (selErr) throw new Error('Failed to check shop membership');
  if (existing) return;

  const { error: insErr } = await admin
    .from('tenant_members')
    .insert({ user_id: userId, tenant_id: tenantId, role: 'admin', status: 'active' });

  if (insErr) throw new Error('Failed to assign shop owner');
}

/** True when `userId` is an active admin of `tenantId` — the shop-ownership check. */
export async function isShopAdmin(userId: string, tenantId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin()
    .from('tenant_members')
    .select('id')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .eq('role', 'admin')
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw new Error('Failed to check shop admin');
  return data !== null;
}

/** The shops a user owns (active admin memberships), for the dashboard shop picker. */
export async function getUserShops(userId: string): Promise<ShopSummary[]> {
  const { data, error } = await supabaseAdmin()
    .from('tenant_members')
    .select('tenant_id, tenants(subdomain, business_name)')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .eq('status', 'active');

  if (error) throw new Error('Failed to load shops');

  type Joined = { tenant_id: string; tenants: { subdomain: string; business_name: string } | null };
  return ((data ?? []) as Joined[])
    .filter((r): r is Joined & { tenants: NonNullable<Joined['tenants']> } => r.tenants !== null)
    .map((r) => ({
      tenantId: r.tenant_id,
      subdomain: r.tenants.subdomain,
      businessName: r.tenants.business_name,
    }));
}
