import 'server-only';
/**
 * Buyer accounts on a shop (Full; Alex 2026-10-25/26). A buyer is a person in the
 * shared sign-in system with a customer membership at this shop and a customer
 * profile there; each shop's buyers are its own. Orders placed while signed in
 * carry the profile, and My account lists them.
 *
 * Sign-in is open only when the shop has the buyer_accounts feature (its plan is
 * Full) AND the maker's own switch is on. Below Full the accounts are kept, never
 * deleted; they just can't sign in.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { loadSiteFeatures } from '@/lib/backend/features';
import { formatPrice } from '@/lib/storefront/catalog';
import { cartEntry } from '@/lib/storefront/cart';

type Db = SupabaseClient<Database>;

/** Whether buyers can sign in on this shop right now. */
export async function buyerAccountsOpen(db: Db, tenantId: string): Promise<boolean> {
  const [features, tenant] = await Promise.all([
    loadSiteFeatures(db, tenantId),
    db.from('tenants').select('buyer_accounts_on').eq('id', tenantId).maybeSingle(),
  ]);
  if (tenant.error !== null) throw new Error(`Could not read the buyer accounts switch: ${tenant.error.message}`);
  return features.has('buyer_accounts') && tenant.data?.buyer_accounts_on === true;
}

export type Buyer = { userId: string; profileId: string; name: string };

/**
 * The buyer's profile at this shop, made the first time they sign in here. A
 * person whose membership here was removed gets null (no sign-in). The shop's
 * owner signing in on her own shop keeps her owner membership; her profile hangs
 * off it, so she can try her own shop as a buyer.
 */
export async function ensureBuyer(db: Db, tenantId: string, userId: string, name: string): Promise<Buyer | null> {
  const { data: member, error: memberError } = await db
    .from('tenant_members')
    .select('id, status')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (memberError !== null) throw new Error(`Could not read the membership: ${memberError.message}`);
  if (member !== null && member.status !== 'active') return null;

  let memberId = member?.id;
  if (memberId === undefined) {
    const { data: made, error } = await db
      .from('tenant_members')
      .insert({ user_id: userId, tenant_id: tenantId, role: 'customer', status: 'active' })
      .select('id')
      .single();
    if (error !== null) throw new Error(`Could not add the buyer: ${error.message}`);
    memberId = made.id;
  }

  const { data: profile, error: profileError } = await db
    .from('customer_profiles')
    .select('id, display_name')
    .eq('tenant_member_id', memberId)
    .maybeSingle();
  if (profileError !== null) throw new Error(`Could not read the buyer: ${profileError.message}`);
  if (profile !== null) return { userId, profileId: profile.id, name: profile.display_name ?? '' };

  const { data: made, error } = await db
    .from('customer_profiles')
    .insert({ tenant_member_id: memberId, tenant_id: tenantId, user_id: userId, display_name: name === '' ? null : name })
    .select('id')
    .single();
  if (error !== null) throw new Error(`Could not add the buyer: ${error.message}`);
  return { userId, profileId: made.id, name };
}

/** The buyer a pass names, at this shop, or null when they have no profile or were removed. */
export async function buyerFor(db: Db, tenantId: string, userId: string): Promise<Buyer | null> {
  const { data, error } = await db
    .from('customer_profiles')
    .select('id, display_name, tenant_members!inner(status)')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('tenant_members.status', 'active')
    .maybeSingle();
  if (error !== null) throw new Error(`Could not read the buyer: ${error.message}`);
  return data === null ? null : { userId, profileId: data.id, name: data.display_name ?? '' };
}

export type BuyerOrderSummary = { number: string; placedAt: string; status: string; total: string };

export async function listBuyerOrders(db: Db, tenantId: string, profileId: string): Promise<BuyerOrderSummary[]> {
  const { data, error } = await db
    .from('orders')
    .select('order_number, created_at, status, total_cents')
    .eq('tenant_id', tenantId)
    .eq('customer_profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error !== null) throw new Error(`Could not load the orders: ${error.message}`);
  return (data ?? []).map((o) => ({ number: o.order_number, placedAt: o.created_at, status: o.status, total: formatPrice(o.total_cents) }));
}

export type BuyerOrder = BuyerOrderSummary & {
  lines: { name: string; option: string; quantity: number; price: string; entry: string | null }[];
  subtotal: string;
  discount: { label: string; amount: string } | null;
  shipping: string | null;
  tax: string | null;
  /** Reorder shows on a paid order (Alex, 2026-10-25). */
  paid: boolean;
};

const PAID = new Set(['paid', 'fulfilled', 'shipped', 'delivered']);

export async function loadBuyerOrder(db: Db, tenantId: string, profileId: string, number: string): Promise<BuyerOrder | null> {
  const { data, error } = await db
    .from('orders')
    .select('order_number, created_at, status, total_cents, subtotal_cents, discount_cents, discount_label, shipping_cents, tax_cents, paid_at, order_items(name_snapshot, variant_description_snapshot, quantity, unit_price_cents, listing_id, listing_variant_id, created_at)')
    .eq('tenant_id', tenantId)
    .eq('customer_profile_id', profileId)
    .eq('order_number', number)
    .maybeSingle();
  if (error !== null) throw new Error(`Could not load the order: ${error.message}`);
  if (data === null) return null;
  const items = [...data.order_items].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return {
    number: data.order_number,
    placedAt: data.created_at,
    status: data.status,
    total: formatPrice(data.total_cents),
    subtotal: formatPrice(data.subtotal_cents),
    discount: data.discount_cents > 0 ? { label: data.discount_label ?? '', amount: formatPrice(data.discount_cents) } : null,
    shipping: data.shipping_cents > 0 ? formatPrice(data.shipping_cents) : null,
    tax: data.tax_cents > 0 ? formatPrice(data.tax_cents) : null,
    paid: data.paid_at !== null && PAID.has(data.status),
    lines: items.map((i) => ({
      name: i.name_snapshot,
      option: i.variant_description_snapshot ?? '',
      quantity: i.quantity,
      price: formatPrice(i.unit_price_cents),
      entry: i.listing_id === null ? null : cartEntry(i.listing_id, i.listing_variant_id),
    })),
  };
}

/** How many buyers a shop has (the step-down screen's count). */
export async function countBuyers(db: Db, tenantId: string): Promise<number> {
  const { count, error } = await db.from('customer_profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId);
  if (error !== null) throw new Error(`Could not count the buyers: ${error.message}`);
  return count ?? 0;
}
