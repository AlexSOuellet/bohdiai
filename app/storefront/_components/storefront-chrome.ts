import { supabaseAdmin } from '@/lib/supabase';

/**
 * Computes the nav section list for a storefront at render time, based on what
 * actually exists for the tenant — not what was decided at onboarding. This is
 * the single source of truth: every storefront page should use this helper so
 * the nav looks the same everywhere (home, /shop, /contact, /subscriptions,
 * /collections/[slug], legal pages, etc).
 *
 * Sections appear in a consistent order. Add new sections here as new feature
 * areas ship — never hardcode a sections list inside a route file.
 */
export async function loadStorefrontChrome(tenantId: string): Promise<{
  shopName: string;
  sections: string[];
}> {
  const db = supabaseAdmin();

  const [tenantQ, collectionsQ, subscriptionsQ, galleryQ, eventsQ, aboutQ] = await Promise.all([
    db.from('tenants').select('business_name').eq('id', tenantId).single(),
    db
      .from('collections')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .is('deleted_at', null),
    db
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('listing_type', 'subscription')
      .eq('status', 'active')
      .is('deleted_at', null),
    db
      .from('content_pages')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('slug', '/gallery')
      .eq('status', 'published'),
    db
      .from('page_blocks')
      .select('block_key', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('block_key', 'events-list')
      .eq('is_visible', true),
    db
      .from('page_blocks')
      .select('block_key', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('block_key', 'about-maker')
      .eq('is_visible', true),
  ]);

  const shopName = tenantQ.data?.business_name ?? 'Shop';

  const sections: string[] = ['shop'];
  if ((aboutQ.count ?? 0) > 0) sections.push('about');
  if ((collectionsQ.count ?? 0) > 0) sections.push('collections');
  if ((subscriptionsQ.count ?? 0) > 0) sections.push('subscriptions');
  if ((eventsQ.count ?? 0) > 0) sections.push('events');
  if ((galleryQ.count ?? 0) > 0) sections.push('gallery');
  sections.push('contact');

  return { shopName, sections };
}
