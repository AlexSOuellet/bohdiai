import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { renderBlock } from '@/lib/block-registry';
import { BLOCKS_MANIFEST } from '@/lib/blocks-manifest.generated';
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
  /**
   * When true, missing pages return 404. When false (default for /shop and
   * /contact, which every tenant should have), missing pages still 404 — the
   * flag exists for /gallery, which is conditionally generated.
   */
  required?: boolean;
}

function contentToRecord(content: Json): Record<string, unknown> | null {
  if (typeof content !== 'object' || content === null || Array.isArray(content)) {
    return null;
  }
  return content as Record<string, unknown>;
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

  // Read layout_tree via a typed-around query — database.types.ts predates
  // the column.
  const pageExtended = await (async () => {
    const client = db as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            maybeSingle: () => Promise<{ data: { layout_tree: Json | null } | null }>;
          };
        };
      };
    };
    const res = await client
      .from('content_pages')
      .select('layout_tree')
      .eq('id', pageRaw.id)
      .maybeSingle();
    return res.data;
  })();

  if (pageExtended !== null && pageExtended.layout_tree !== null) {
    return renderLayoutEnginePage({
      tenantId,
      pageRecord: {
        slug: pageRaw.slug,
        title: pageRaw.title,
        layoutTree: pageExtended.layout_tree,
      },
    });
  }

  const { data: blocks } = await db
    .from('page_blocks')
    .select('block_key, position, content')
    .eq('page_id', pageRaw.id)
    .eq('is_visible', true)
    .order('position', { ascending: true });

  // Fallback: tenants generated before footer-classic existed don't have a
  // footer row in page_blocks. Inject one at render time so every page on
  // every storefront ends with the legal links + platform credit.
  const resolvedBlocks = blocks ?? [];
  const hasFooter = resolvedBlocks.some((b) => {
    const manifest = BLOCKS_MANIFEST.find((m) => m.key === b.block_key);
    return manifest?.sectionType === 'footer';
  });

  let footerFallback: typeof resolvedBlocks[number] | null = null;
  if (!hasFooter) {
    const { data: tenant } = await db
      .from('tenants')
      .select('business_name')
      .eq('id', tenantId)
      .single();
    if (tenant !== null) {
      footerFallback = {
        block_key: 'footer-classic',
        position: 9999,
        content: { shopName: tenant.business_name, sections: JSON.stringify(['shop', 'contact']) },
      };
    }
  }

  const allBlocks = footerFallback === null ? resolvedBlocks : [...resolvedBlocks, footerFallback];

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <main>
      {allBlocks.map((block) => {
        const content = contentToRecord(block.content);
        if (content === null) return null;
        const rendered = renderBlock(
          { block_key: block.block_key, position: block.position, content },
          tenantId,
        );
        if (!isDev) return rendered;
        return (
          <div key={block.block_key + block.position} style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 8, left: 8, zIndex: 9999,
              background: 'rgba(0,0,0,0.75)', color: '#facc15',
              fontFamily: 'monospace', fontSize: '11px', fontWeight: 600,
              padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.05em',
              pointerEvents: 'none', userSelect: 'none',
            }}>
              {block.block_key}
            </div>
            {rendered}
          </div>
        );
      })}
    </main>
  );
}

interface LayoutEnginePageRecord {
  slug: string;
  title: string;
  layoutTree: Json;
}

async function renderLayoutEnginePage({
  tenantId,
  pageRecord,
}: {
  tenantId: string;
  pageRecord: LayoutEnginePageRecord;
}) {
  const db = supabaseAdmin();
  const treeContainer =
    typeof pageRecord.layoutTree === 'object' &&
    pageRecord.layoutTree !== null &&
    !Array.isArray(pageRecord.layoutTree)
      ? (pageRecord.layoutTree as Record<string, unknown>)
      : null;

  if (treeContainer === null) {
    notFound();
  }

  const rootRaw = treeContainer['root'];
  const metaRaw = treeContainer['meta'];
  const parsedPage = PageSchema.safeParse({
    slug: pageRecord.slug.replace(/^\/+/, '') || 'home',
    name: pageRecord.title,
    root: rootRaw,
    ...(metaRaw !== null && metaRaw !== undefined ? { meta: metaRaw } : {}),
  });
  if (!parsedPage.success) {
    notFound();
  }

  const styleSheetRow = await (async () => {
    const client = db as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            eq: (col: string, val: boolean) => {
              maybeSingle: () => Promise<{ data: { sheet: Json } | null }>;
            };
          };
        };
      };
    };
    const res = await client
      .from('style_sheets')
      .select('sheet')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .maybeSingle();
    return res.data;
  })();

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
              {...(l.crossOrigin === 'anonymous' ? { crossOrigin: 'anonymous' as const } : {})}
            />
          ))}
          {compiled.googleFontLinks.map((href) => (
            <link key={href} rel="stylesheet" href={href} />
          ))}
          <style dangerouslySetInnerHTML={{ __html: compiled.cssVariables }} />
          {compiled.customFontFaces !== '' && (
            <style dangerouslySetInnerHTML={{ __html: compiled.customFontFaces }} />
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
