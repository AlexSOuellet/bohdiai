import { supabaseAdmin } from '@/lib/supabase';
import { sanitizeDeep } from '@/lib/copy-sanitize';
import { writeStorefrontLayout } from '@/lib/generation/write-storefront-layout';
import { StyleSheetSchema } from '@/lib/style-sheet';
import { validatePage } from '@/lib/layout';
import { logger } from '@/lib/logger';
import type { BohdiToolDef, HandlerContext } from './tools';
import type { BohdiAccumulator } from './types';

export const BOHDI_LAYOUT_TOOLS: BohdiToolDef[] = [
  {
    name: 'set_style_sheet',
    description:
      "Author the style sheet for this storefront — the vocabulary of color, type, and texture Bohdi will paint with. Three arrays.\n\n" +
      "palette: 6-15 named colors. Each entry: { name: human-readable name; value: hex (#rrggbb); character: 1-3 sentences describing what this color IS (the world it comes from, the feeling it carries). Roles are NOT declared here — Bohdi assigns roles per composition by attaching palette intent to nodes. }\n\n" +
      "fonts: 3-10 named typefaces. Each entry: { name: human-readable name; family: exact font-family string; source: 'google' | 'system' | 'custom'; weights: array of 100-900 multiples; styles: optional ['normal'] or ['normal','italic']; fallback: 'sans-serif' | 'serif' | 'monospace' | 'cursive' | 'system-ui'; character: 1-3 sentences describing the typeface's voice; customUrl: required if source='custom'. } No font is tagged 'heading' or 'body' — Bohdi assigns type roles per composition.\n\n" +
      "textures: 0-8 named surface treatments. Each entry: { name; value: CSS image value (e.g. url(...), linear-gradient(...)); character: 1-3 sentences describing the texture's feel. }",
    input_schema: {
      type: 'object',
      properties: {
        palette: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'string', description: 'Hex color: #rgb, #rrggbb, or #rrggbbaa.' },
              character: { type: 'string' },
            },
            required: ['name', 'value', 'character'],
          },
        },
        fonts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              family: { type: 'string' },
              source: { type: 'string', enum: ['google', 'system', 'custom'] },
              weights: {
                type: 'array',
                items: {
                  type: 'integer',
                  enum: [100, 200, 300, 400, 500, 600, 700, 800, 900],
                },
              },
              styles: {
                type: 'array',
                items: { type: 'string', enum: ['normal', 'italic'] },
              },
              fallback: {
                type: 'string',
                enum: ['sans-serif', 'serif', 'monospace', 'cursive', 'system-ui'],
              },
              character: { type: 'string' },
              customUrl: { type: 'string' },
            },
            required: ['name', 'family', 'source', 'weights', 'fallback', 'character'],
          },
        },
        textures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'string' },
              character: { type: 'string' },
            },
            required: ['name', 'value', 'character'],
          },
        },
      },
      required: ['palette', 'fonts', 'textures'],
    },
  },
  {
    name: 'set_layout',
    description:
      "Compose a complete page as a tree of layout primitives and content nodes. Call once per page (home, about, shop, contact, any custom pages). The page is composed in full — header, body, footer all part of the same tree, all under Bohdi's authorship.\n\n" +
      "PAGE INPUT: { slug, name, root, meta? }. slug is the URL path ('home', 'about', 'shop/[slug]'). root is the top-level node. meta is optional { title, description } for SEO.\n\n" +
      "EVERY node has a 'type' field plus type-specific fields. Every node accepts optional id (own anchor for art-director feedback) and intent ({ palette, type, texture, density } — all optional, all reference NAMED entries from the style sheet by name).\n\n" +
      "LAYOUT PRIMITIVES (geometry):\n" +
      "- band — full-width horizontal section. children: array. fields: padding ('none'..'xxl'), minHeight ('auto'..'screen'), align ('start'..'stretch'), justify ('start'..'stretch'), contentWidth ('narrow' ~768px | 'normal' ~1024px default | 'wide' ~1280px | 'full' edge-to-edge). The band's background still bleeds full-width regardless of contentWidth — only the inner content is capped. Use 'full' only when you genuinely want edge-to-edge content (rare). mobile: { padding?, minHeight?, align?, justify? }.\n" +
      "- stack — vertical sequence. children: array. fields: gap, align, justify. mobile: { gap?, align?, justify? }.\n" +
      "- row — horizontal sequence. children: array. fields: gap, align (incl 'baseline'), justify, wrap. mobile: { gap?, align?, justify?, collapse: 'wrap' | 'stack' | 'preserve' }.\n" +
      "- split — N panes (2-8). children: array, ratios: array of N numbers summing to 100. fields: direction ('horizontal'|'vertical'), gap, align. mobile: { direction?, gap?, stackOrder?: permutation of [0..N-1] }.\n" +
      "- grid — regular N-column M-row. children: array. fields: columns (1-12), rows? (1-12), gapX, gapY, align, justify. mobile: { columns? (1-6), gapX?, gapY? }.\n" +
      "- overlap — z-layered children. children: array, anchor: index of the child that holds the natural flow. fields: align ('top-left' | 'top' | 'top-right' | 'left' | 'center' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right'), scrim ('none' | 'light' | 'dark' | 'auto' — auto lays a contrast gradient when the anchor is an image and text is layered above; default 'auto'). mobile: { collapse: 'preserve' | 'stack', stackOrder? }.\n" +
      "- bleed — single child that extends to the viewport edge. child: a node, side: 'left' | 'right' | 'both' | 'top' | 'bottom' | 'all'. mobile: { side? }.\n" +
      "- pane — contained box. child: a node, padding?, radius? ('none' | 'sm' | 'md' | 'lg' | 'pill' | 'full'), border? ('none' | 'hairline' | 'thin' | 'medium' | 'thick'), shadow? ('none' | 'sm' | 'md' | 'lg'), fill?: boolean (paints palette intent as background). mobile: { padding?, radius?, border?, shadow? }.\n" +
      "- marquee — horizontally scrolling sequence. children: array. fields: direction ('left'|'right'), speed ('slow'|'medium'|'fast'), gap, pauseOnHover. mobile: { speed?, gap? }.\n" +
      "- gutter — empty space. fields: size ('xs'..'xxl'), axis ('vertical' | 'horizontal'). mobile: { size? }.\n\n" +
      "AUTHORED CONTENT NODES:\n" +
      "- text — { role: 'eyebrow' | 'headline' | 'sub' | 'body' | 'caption', content: string, align?: 'start' | 'center' | 'end', mobile?: { role? — override role on small screens; if omitted, mobile auto-steps one size down to avoid cramped layouts } }.\n" +
      "- image — { brief: string for image generation, alt: string, aspect?: '1:1' | '4:5' | '3:4' | '4:3' | '3:2' | '16:9' | '21:9' | 'auto', focal?: { x: 0-100, y: 0-100 } }.\n" +
      "- button — { label, href, variant?: 'primary' | 'secondary' | 'ghost' | 'link' }. Internal hrefs MUST match real storefront routes: '/', '/about', '/shop', '/listings/{slug}', '/collections', '/collections/{slug}', '/subscriptions', '/cart', '/contact', '/#events'. External URLs are fine. Inventing routes ('/shop/product-name') 404s.\n" +
      "- wordmark — { kind: 'text' | 'image', content: the text or the image URL, href? }.\n" +
      "- video — { assetUrl, poster?, autoplay?, loop?, muted?, controls?, aspect? }.\n" +
      "- divider — { weight?: 'hairline' | 'thin' | 'medium' | 'thick', style?: 'solid' | 'dashed' | 'dotted' }.\n" +
      "- quote — { body, attribution?, role? }.\n\n" +
      "BOUND CONTENT NODES (data flows in at render time — never inline data):\n" +
      "- productGrid — { count?, order?: 'featured' | 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'manual', filter?: { collectionSlug?, tag? }, manualIds?, columns?, mobileColumns? }.\n" +
      "- featuredProduct — { productId, showPrice?, showAddToCart? }.\n" +
      "- collectionGrid — { count?, order?, manualSlugs?, columns?, mobileColumns? }.\n" +
      "- featuredCollection — { collectionSlug, previewCount? }.\n" +
      "- subscriptionGrid — { count?, columns?, mobileColumns? }.\n" +
      "- featuredSubscription — { subscriptionId }.\n" +
      "- contactForm — { fields?: array of { name, label, kind: 'text'|'email'|'tel'|'textarea'|'select', required?, placeholder?, options? }, submitLabel?, successMessage? }.\n" +
      "- cart — { variant: 'icon' | 'page' }.\n" +
      "- socialLinks — { platforms?, style?: 'icons' | 'labels' | 'both' }.\n" +
      "- navLinks — { order?: 'auto' | 'manual', manualOrder?, style?: 'plain' | 'underlined' | 'pill' }.\n" +
      "- eventsList — { count?, upcoming?, layout?: 'stack' | 'grid' | 'row' }.\n\n" +
      "Returns { ok: true } on success, or { ok: false, issues: [{ path, message }] } on validation failure so Bohdi can correct.",
    input_schema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: "URL path. 'home' for the home page." },
        name: { type: 'string', description: 'Human-readable page name.' },
        root: { type: 'object', description: 'The root LayoutNode of the page tree.' },
        meta: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
          },
        },
      },
      required: ['slug', 'name', 'root'],
    },
  },
];

interface SetStyleSheetArgs {
  palette: unknown;
  fonts: unknown;
  textures: unknown;
}

interface SetLayoutArgs {
  slug: string;
  name: string;
  root: unknown;
  meta?: unknown;
}

export type LayoutToolResult =
  | { ok: true; message: string }
  | { ok: false; issues: { path: string; message: string }[] };

export async function handleSetStyleSheet(
  args: unknown,
  accumulator: BohdiAccumulator,
): Promise<LayoutToolResult> {
  const parsed = StyleSheetSchema.safeParse(args as SetStyleSheetArgs);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((i) => ({
        path: i.path.join('.') || '(root)',
        message: i.message,
      })),
    };
  }
  accumulator.styleSheet = parsed.data;
  return {
    ok: true,
    message: `Style sheet set. Palette: ${parsed.data.palette.length} colors. Fonts: ${parsed.data.fonts.length}. Textures: ${parsed.data.textures.length}.`,
  };
}

export async function finalizeLayoutEngine(
  ctx: HandlerContext,
): Promise<{ tenantId: string; subdomain: string }> {
  const a = ctx.accumulator;
  if (a.styleSheet === null) {
    throw new Error('finalize (layout engine): style sheet not set — call set_style_sheet first');
  }
  if (a.layoutPages.length === 0) {
    throw new Error('finalize (layout engine): no layout pages set — call set_layout for at least the home page');
  }

  const sanitizedPages = a.layoutPages.map((p) => sanitizeDeep(p));
  const sanitizedCollections = sanitizeDeep(a.collections);
  const sanitizedListings = sanitizeDeep(a.listings);
  const sanitizedSubscriptions = sanitizeDeep(a.subscriptions);

  const { data: niche } = await supabaseAdmin()
    .from('niches')
    .select('tenant_type_fit')
    .eq('slug', ctx.brief.nicheSlug)
    .single();
  const tenantTypes = niche?.tenant_type_fit ?? ['seller'];

  const result = await writeStorefrontLayout({
    subdomain: ctx.brief.subdomain,
    shopName: ctx.brief.shopName,
    nicheSlug: ctx.brief.nicheSlug,
    moodKey: ctx.brief.moodKey,
    tenantTypes,
    styleSheet: a.styleSheet,
    layoutPages: sanitizedPages,
    collections: sanitizedCollections,
    listings: sanitizedListings,
    subscriptions: sanitizedSubscriptions,
    ...(ctx.brief.logoUrl !== undefined ? { logoUrl: ctx.brief.logoUrl } : {}),
  });

  ctx.tenantIdRef.value = result.tenantId;
  ctx.done.value = true;
  ctx.done.result = result;

  const dbUpdate = supabaseAdmin() as unknown as {
    from: (t: string) => {
      update: (r: unknown) => {
        is: (col: string, val: unknown) => {
          eq: (col: string, val: unknown) => {
            eq: (col: string, val: unknown) => Promise<unknown>;
          };
        };
      };
    };
  };
  await dbUpdate
    .from('design_choices')
    .update({ tenant_id: result.tenantId })
    .is('tenant_id', null)
    .eq('niche_slug', ctx.brief.nicheSlug)
    .eq('mood_key', ctx.brief.moodKey);

  logger.info('bohdi: finalize (layout engine)', {
    tenantId: result.tenantId,
    subdomain: result.subdomain,
    pages: sanitizedPages.length,
    palette: a.styleSheet.palette.length,
    fonts: a.styleSheet.fonts.length,
    textures: a.styleSheet.textures.length,
  });

  return result;
}

export async function handleSetLayout(
  args: unknown,
  accumulator: BohdiAccumulator,
): Promise<LayoutToolResult> {
  const a = args as SetLayoutArgs;
  if (
    typeof a !== 'object' ||
    a === null ||
    typeof a.slug !== 'string' ||
    typeof a.name !== 'string'
  ) {
    return {
      ok: false,
      issues: [{ path: '(root)', message: 'slug and name are required strings' }],
    };
  }
  const candidatePage = {
    slug: a.slug,
    name: a.name,
    root: a.root,
    ...(a.meta !== undefined ? { meta: a.meta } : {}),
  };
  const result = validatePage(candidatePage);
  if (!result.ok) {
    return { ok: false, issues: result.issues };
  }
  const existingIdx = accumulator.layoutPages.findIndex(
    (p) => p.slug === result.page.slug,
  );
  if (existingIdx >= 0) {
    accumulator.layoutPages[existingIdx] = result.page;
  } else {
    accumulator.layoutPages.push(result.page);
  }
  return {
    ok: true,
    message: `Layout set for /${result.page.slug}.`,
  };
}
