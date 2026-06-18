import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { LayoutPage } from '@/components/storefront/layout';
import { PageSchema, resolvePage } from '@/lib/layout';
import { createResolveContextForTenant } from '@/lib/layout/resolver-supabase';
import { StyleSheetSchema } from '@/lib/style-sheet';
import {
  compileStyleSheet,
  googleFontPreconnectLinks,
} from '@/lib/style-sheet-loader';
import { archetypeSpec } from '@/lib/archetypes/registry';
import type { ArchetypePage } from '@/lib/archetypes/builder';
import type { ProductView, CatalogMedia } from '@/lib/archetypes/content';
import type { Json } from '@/lib/database.types';
import { readVersion } from '@/lib/tryon/write-version';

interface StorefrontPageProps {
  slug: string;
  /** Try-on preview — render the saved version with this label instead of the live store. */
  version?: string | undefined;
}

/** Storefront routes that an archetype paints as a sub-page off the home envelope. */
const SLUG_TO_ARCHETYPE_PAGE: Record<string, ArchetypePage> = {
  '/shop': 'shop',
  '/events': 'events',
  '/about': 'about',
  '/contact': 'contact',
};

/** Load the tenant's home ('/') archetype envelope, or null if the home isn't an
 *  archetype store (legacy tenant) or has no published home. */
async function loadHomeArchetypeEnvelope(tenantId: string): Promise<Record<string, unknown> | null> {
  const db = supabaseAdmin() as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (c: string, v: string) => {
          eq: (c: string, v: string) => {
            eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: { layout_tree: Json | null } | null }> };
          };
        };
      };
    };
  };
  const { data } = await db
    .from('content_pages')
    .select('layout_tree')
    .eq('tenant_id', tenantId)
    .eq('slug', '/')
    .eq('status', 'published')
    .maybeSingle();
  const tree = data?.layout_tree;
  if (tree === null || tree === undefined || typeof tree !== 'object' || Array.isArray(tree)) return null;
  const root = (tree as Record<string, unknown>)['root'];
  if (root === null || typeof root !== 'object' || Array.isArray(root)) return null;
  const rootObj = root as Record<string, unknown>;
  return rootObj['kind'] === 'archetype' ? rootObj : null;
}

/** Load the tenant's logo URL and brand colors in a single round-trip. Both are
 *  injected into archetype chrome at render — tenant facts, not authored content.
 *  logoUrl is undefined when no logo is stored; brandColors is [] when no color
 *  analysis has run. Both are null for every fresh tenant until the dashboard's
 *  logo-upload step ships. */
async function loadTenantChrome(tenantId: string): Promise<{ logoUrl: string | undefined; brandColors: string[] }> {
  const db = supabaseAdmin() as unknown as {
    from: (t: string) => {
      select: (c: string) => { eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: { logo_url: string | null; brand_colors: string[] | null } | null }> } };
    };
  };
  const { data } = await db.from('tenants').select('logo_url, brand_colors').eq('id', tenantId).maybeSingle();
  return {
    logoUrl: data?.logo_url ?? undefined,
    brandColors: data?.brand_colors ?? [],
  };
}

/** Resolve the tenant's home archetype spec + envelope, or null for a legacy
 *  tenant. Shared by the product and content-page routes so they paint in the
 *  archetype's chrome instead of the legacy system. */
async function resolveArchetype(tenantId: string) {
  const env = await loadHomeArchetypeEnvelope(tenantId);
  if (env === null) return null;
  const key = env['archetypeKey'];
  const lookKey = env['lookKey'];
  if (typeof key !== 'string' || typeof lookKey !== 'string') return null;
  const spec = archetypeSpec(key);
  if (spec === undefined) return null;
  const { logoUrl, brandColors } = await loadTenantChrome(tenantId);
  const accentOverride = typeof env['accentOverride'] === 'string' ? (env['accentOverride'] as string) : undefined;
  return { spec, lookKey, content: env['content'], logoUrl, brandColors, accentOverride };
}

/** Render a product detail page in the tenant's archetype, or null if the tenant
 *  is a legacy store / the archetype has no product page. */
export async function renderArchetypeProductPage(tenantId: string, product: ProductView) {
  const a = await resolveArchetype(tenantId);
  if (a === null || a.spec.renderProduct === undefined) return null;
  return a.spec.renderProduct({ content: a.content, lookKey: a.lookKey, product, logoUrl: a.logoUrl, brandColors: a.brandColors, accentOverride: a.accentOverride });
}

/** Render a plain content page (legal/maker-added) in the tenant's archetype, or
 *  null if the tenant is a legacy store / the archetype has no content page. */
export async function renderArchetypeContentPage(
  tenantId: string,
  opts: { title?: string; body?: string[]; html?: string },
) {
  const a = await resolveArchetype(tenantId);
  if (a === null || a.spec.renderContentPage === undefined) return null;
  return a.spec.renderContentPage({ content: a.content, lookKey: a.lookKey, ...opts, logoUrl: a.logoUrl, brandColors: a.brandColors, accentOverride: a.accentOverride });
}

/** Wrap a functional page's body (cart, collections, subscriptions) in the
 *  tenant's archetype chrome, or null if the tenant is a legacy store. */
export async function renderArchetypeShell(tenantId: string, children: ReactNode) {
  const a = await resolveArchetype(tenantId);
  if (a === null || a.spec.renderShell === undefined) return null;
  return a.spec.renderShell({ content: a.content, lookKey: a.lookKey, children, logoUrl: a.logoUrl, brandColors: a.brandColors, accentOverride: a.accentOverride });
}

export default async function StorefrontPage({ slug, version }: StorefrontPageProps) {
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');
  if (tenantId === null) notFound();

  // Try-on preview: if ?v=<label> names a saved version, render it in place.
  // (Owner-gating is deferred — see the try-on spec.) Unknown labels fall
  // through to the live store below.
  if (version !== undefined && version !== '') {
    const env = await readVersion(tenantId, version);
    if (env && env.kind === 'archetype') {
      const spec = archetypeSpec(env.archetypeKey);
      if (spec) {
        const { logoUrl, brandColors } = await loadTenantChrome(tenantId);
        return spec.render({
          content: env.content,
          lookKey: env.lookKey,
          products: (env.products ?? []) as ProductView[],
          mood: env.mood,
          catalogSize: env.catalogSize,
          logoUrl,
          brandColors,
          tenantId,
        });
      }
    }
  }

  // Multi-page archetype: a sub-page route (/shop, /events, …) has no row of its
  // own — it renders the SAME stored archetype envelope (on the home '/' row) as
  // a different page. If the tenant is an archetype store, paint that page here;
  // otherwise fall through to the legacy per-slug content_pages system.
  const subPage = SLUG_TO_ARCHETYPE_PAGE[slug];
  if (subPage !== undefined) {
    const env = await loadHomeArchetypeEnvelope(tenantId);
    if (env !== null) return renderArchetypeStore(env, tenantId, subPage);
  }

  const db = supabaseAdmin();

  const { data: pageRaw } = await db
    .from('content_pages')
    .select('id, slug, title')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (pageRaw === null) notFound();

  const client = db as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{
            data: { layout_tree: Json | null } | null;
          }>;
          eq: (col: string, val: boolean) => {
            maybeSingle: () => Promise<{ data: { sheet: Json } | null }>;
          };
        };
      };
    };
  };

  const { data: pageExtended } = await client
    .from('content_pages')
    .select('layout_tree')
    .eq('id', pageRaw.id)
    .maybeSingle();

  if (pageExtended === null || pageExtended.layout_tree === null) {
    notFound();
  }

  const treeContainer =
    typeof pageExtended.layout_tree === 'object' &&
    pageExtended.layout_tree !== null &&
    !Array.isArray(pageExtended.layout_tree)
      ? (pageExtended.layout_tree as Record<string, unknown>)
      : null;

  if (treeContainer === null) {
    notFound();
  }

  const rootRaw = treeContainer['root'];
  const metaRaw = treeContainer['meta'];

  // Archetype branch — the home page carries an archetype envelope, not a layout
  // tree. The archetype styles entirely from its skin, so no style_sheet; the
  // catalog comes from the tenant's real listing rows.
  if (
    rootRaw !== null &&
    typeof rootRaw === 'object' &&
    !Array.isArray(rootRaw) &&
    (rootRaw as Record<string, unknown>)['kind'] === 'archetype'
  ) {
    return renderArchetypeStore(rootRaw as Record<string, unknown>, tenantId);
  }

  const parsedPage = PageSchema.safeParse({
    slug: pageRaw.slug.replace(/^\/+/, '') || 'home',
    name: pageRaw.title,
    root: rootRaw,
    ...(metaRaw !== null && metaRaw !== undefined ? { meta: metaRaw } : {}),
  });
  if (!parsedPage.success) {
    notFound();
  }

  const { data: styleSheetRow } = await client
    .from('style_sheets')
    .select('sheet')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .maybeSingle();

  const styleResult =
    styleSheetRow !== null && styleSheetRow.sheet !== null
      ? parseStyleSheet(styleSheetRow.sheet)
      : null;
  const compiled = styleResult?.compiled ?? null;

  const resolved = await resolvePage(
    parsedPage.data,
    createResolveContextForTenant(tenantId),
  );

  return (
    <>
      {compiled !== null && (
        <>
          {googleFontPreconnectLinks().map((l) => (
            <link
              key={l.href}
              rel={l.rel}
              href={l.href}
              {...(l.crossOrigin === 'anonymous'
                ? { crossOrigin: 'anonymous' as const }
                : {})}
            />
          ))}
          {compiled.googleFontLinks.map((href) => (
            <link key={href} rel="stylesheet" href={href} />
          ))}
          <style dangerouslySetInnerHTML={{ __html: compiled.cssVariables }} />
          {compiled.customFontFaces !== '' && (
            <style
              dangerouslySetInnerHTML={{ __html: compiled.customFontFaces }}
            />
          )}
        </>
      )}
      <LayoutPage page={parsedPage.data} resolved={resolved} />
    </>
  );
}

function parseStyleSheet(sheet: Json) {
  const parsed = StyleSheetSchema.safeParse(sheet);
  if (!parsed.success) return null;
  return { compiled: compileStyleSheet(parsed.data) };
}

function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

interface ListingRow {
  slug: string;
  name: string;
  base_price_cents: number;
  short_description: string | null;
  description: string | null;
  metadata: { image_url?: string } | null;
}

/** Render a stored archetype store: load the real catalog rows as ProductViews
 *  and paint via the chosen archetype's registered renderer. */
async function renderArchetypeStore(env: Record<string, unknown>, tenantId: string, page?: ArchetypePage) {
  const archetypeKey = env['archetypeKey'];
  const lookKey = env['lookKey'];
  if (typeof archetypeKey !== 'string' || typeof lookKey !== 'string') notFound();

  const spec = archetypeSpec(archetypeKey as string);
  if (spec === undefined) notFound();

  const db = supabaseAdmin() as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (c: string, v: string) => {
          eq: (c: string, v: string) => {
            order: (c: string, o: { ascending: boolean }) => Promise<{ data: ListingRow[] | null }>;
          };
        };
      };
    };
  };
  const { data: rows } = await db
    .from('listings')
    .select('slug, name, base_price_cents, short_description, description, metadata')
    .eq('tenant_id', tenantId)
    .eq('listing_type', 'product')
    .order('created_at', { ascending: true });

  const products: ProductView[] = (rows ?? []).map((r) => {
    const url = r.metadata?.image_url;
    const media: CatalogMedia[] = url ? [{ kind: 'image', url, alt: r.name }] : [];
    return {
      slug: r.slug,
      name: r.name,
      price: formatPrice(r.base_price_cents),
      ...(r.short_description ? { shortDescription: r.short_description } : {}),
      description: r.description ?? '',
      status: 'active',
      media,
      variations: [],
    };
  });

  const mood = typeof env['mood'] === 'string' ? (env['mood'] as string) : undefined;
  const catalogSize = typeof env['catalogSize'] === 'number' ? (env['catalogSize'] as number) : undefined;
  const accentOverride = typeof env['accentOverride'] === 'string' ? (env['accentOverride'] as string) : undefined;
  const { logoUrl, brandColors } = await loadTenantChrome(tenantId);
  return spec.render({ content: env['content'], lookKey: lookKey as string, products, mood, catalogSize, page, logoUrl, brandColors, accentOverride, tenantId });
}
