import { describe, it, expect, afterEach } from 'vitest';
import { writeStorefrontLayout } from './write-storefront-layout';
import { createResolveContextForTenant } from '@/lib/layout/resolver-supabase';
import { supabaseAdmin } from '@/lib/supabase';
import type { Page } from '@/lib/layout';
import type { StyleSheet } from '@/lib/style-sheet';

// Skip in CI — CI uses dummy Supabase credentials that cannot reach a real DB.
// Runs locally where the env has real credentials. Proves the navbar seam end to
// end: a real write -> the columns the RPC sets -> what the resolver hands the renderer.
const describeIfReal = process.env['CI'] === 'true' ? describe.skip : describe;

const STYLE_SHEET: StyleSheet = {
  name: 'test',
  palette: [],
  fonts: [],
  textures: [],
} as unknown as StyleSheet;

function makePage(slug: string, name: string): Page {
  return {
    slug,
    name,
    root: { type: 'band', id: 'r', children: [] },
  } as unknown as Page;
}

function baseInput(pages: Page[], subdomain: string) {
  return {
    subdomain,
    shopName: 'Nav Test Shop',
    nicheSlug: 'candles',
    moodKey: 'rustic',
    tenantTypes: ['seller'],
    styleSheet: STYLE_SHEET,
    layoutPages: pages,
    collections: [],
    listings: [],
    subscriptions: [],
  };
}

describeIfReal('navbar placement (integration)', () => {
  const cleanupIds: string[] = [];

  afterEach(async () => {
    const db = supabaseAdmin();
    // style_sheets isn't in the generated DB types yet (known drift); cast at the boundary.
    const dbUntyped = db as unknown as {
      from: (t: string) => { delete: () => { eq: (c: string, v: string) => Promise<unknown> } };
    };
    for (const tenantId of cleanupIds) {
      await db.from('listings').delete().eq('tenant_id', tenantId);
      await db.from('collections').delete().eq('tenant_id', tenantId);
      await db.from('content_pages').delete().eq('tenant_id', tenantId);
      await dbUntyped.from('style_sheets').delete().eq('tenant_id', tenantId);
      await db.from('tenants').delete().eq('id', tenantId);
    }
    cleanupIds.length = 0;
  });

  it('a written storefront produces a populated navbar: Shop/About/Contact + generated page, Home excluded', async () => {
    const subdomain = `test-nav-${Date.now()}`;

    // Pages intentionally out of order, plus a generated "events" page.
    const result = await writeStorefrontLayout(
      baseInput(
        [
          makePage('home', 'Home'),
          makePage('contact', 'Contact'),
          makePage('about', 'About Brian'),
          makePage('shop', 'Shop All Candles'),
          makePage('events', 'Events'),
        ],
        subdomain,
      ),
    );
    cleanupIds.push(result.tenantId);

    // Ask the resolver for the navbar exactly as the renderer would.
    const ctx = createResolveContextForTenant(result.tenantId);
    const navLinks = await ctx.fetchNavLinks();

    // Home is not in the navbar; the other four are, in policy order.
    expect(navLinks.map((l) => l.slug)).toEqual(['/shop', '/about', '/contact', '/events']);

    // Labels are clean (canonical for the required three, the page name for the generated one).
    expect(navLinks.map((l) => l.label)).toEqual(['Shop', 'About', 'Contact', 'Events']);

    // Home is genuinely absent, not just last.
    expect(navLinks.some((l) => l.slug === '/')).toBe(false);
  });
});
