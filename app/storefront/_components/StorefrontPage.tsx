import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { LayoutPage } from '@/components/storefront/layout';
import { PageSchema } from '@/lib/layout';
import { StyleSheetSchema } from '@/lib/style-sheet';
import {
  compileStyleSheet,
  googleFontPreconnectLinks,
} from '@/lib/style-sheet-loader';
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

  const compiled =
    styleSheetRow !== null && styleSheetRow.sheet !== null
      ? compileStyleSheetIfValid(styleSheetRow.sheet)
      : null;

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
      <LayoutPage page={parsedPage.data} />
    </>
  );
}

function compileStyleSheetIfValid(sheet: Json) {
  const parsed = StyleSheetSchema.safeParse(sheet);
  if (!parsed.success) return null;
  return compileStyleSheet(parsed.data);
}
