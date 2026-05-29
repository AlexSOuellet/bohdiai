import { supabaseAdmin } from '@/lib/supabase';
import { renderBlock } from '@/lib/block-registry';
import { BLOCKS_MANIFEST } from '@/lib/blocks-manifest.generated';
import type { Json } from '@/lib/database.types';
import type { ReactNode } from 'react';

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
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'upcoming')
      .gte('event_date', new Date().toISOString().slice(0, 10)),
    db
      .from('page_blocks')
      .select('block_key', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('block_key', 'about-maker')
      .eq('is_visible', true),
  ]);

  const shopName = tenantQ.data?.business_name ?? 'Shop';

  // Order rule (hard): shop first, conditional items in the middle, about
  // second-to-last, contact last. shop, about, contact are baseline — always
  // present. about is here unconditionally regardless of aboutQ because the
  // /about page exists for every tenant.
  const conditionals: string[] = [];
  if ((collectionsQ.count ?? 0) > 0) conditionals.push('collections');
  if ((subscriptionsQ.count ?? 0) > 0) conditionals.push('subscriptions');
  if ((eventsQ.count ?? 0) > 0) conditionals.push('events');
  if ((galleryQ.count ?? 0) > 0) conditionals.push('gallery');

  const sections: string[] = ['shop', ...conditionals, 'about', 'contact'];

  // aboutQ is read above but no longer used for nav ordering — kept queried
  // in case future render paths want to know whether the home has an about block.
  void aboutQ;

  return { shopName, sections };
}

/**
 * Loads the tenant's chosen nav + footer blocks from their home page and
 * returns them as rendered React elements. Every storefront page that isn't
 * driven by `StorefrontPage` (which already reads blocks from the DB) should
 * use this helper. Uses the stored block content as-is — same nav, same
 * sections, on every page. Sections are frozen at generation time; if the
 * maker adds a collection later and wants it in the nav, that's a separate
 * regeneration concern.
 */
export async function loadStorefrontChromeBlocks(
  tenantId: string,
): Promise<{ nav: ReactNode | null; footer: ReactNode | null }> {
  const db = supabaseAdmin();

  const { data: homePage } = await db
    .from('content_pages')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', '/')
    .eq('status', 'published')
    .maybeSingle();

  if (homePage === null) return { nav: null, footer: null };

  const { data: blocks } = await db
    .from('page_blocks')
    .select('block_key, position, content')
    .eq('page_id', homePage.id)
    .eq('is_visible', true);

  const resolved = blocks ?? [];
  const navRow = resolved.find((b) => {
    const m = BLOCKS_MANIFEST.find((x) => x.key === b.block_key);
    return m?.sectionType === 'nav';
  });
  const footerRow = resolved.find((b) => {
    const m = BLOCKS_MANIFEST.find((x) => x.key === b.block_key);
    return m?.sectionType === 'footer';
  });

  function asRecord(content: Json): Record<string, unknown> {
    if (typeof content !== 'object' || content === null || Array.isArray(content)) return {};
    return content as Record<string, unknown>;
  }

  const nav = navRow
    ? renderBlock(
        {
          block_key: navRow.block_key,
          position: navRow.position,
          content: asRecord(navRow.content),
        },
        tenantId,
      )
    : null;
  const footer = footerRow
    ? renderBlock(
        {
          block_key: footerRow.block_key,
          position: footerRow.position,
          content: asRecord(footerRow.content),
        },
        tenantId,
      )
    : null;

  return { nav, footer };
}
