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
import type { ProductView, CatalogMedia } from '@/lib/archetypes/content';
import type { Json } from '@/lib/database.types';

interface StorefrontPageProps {
  slug: string;
}

export default async function StorefrontPage({ slug }: StorefrontPageProps) {
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');
  if (tenantId === null) notFound();

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
async function renderArchetypeStore(env: Record<string, unknown>, tenantId: string) {
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
  return spec.render({ content: env['content'], lookKey: lookKey as string, products, mood, catalogSize });
}
