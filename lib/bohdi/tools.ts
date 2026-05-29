// Bohdi's tools. Each tool has a JSON schema for the Anthropic API plus a
// handler that runs server-side when Bohdi calls it. The agent loop in
// lib/bohdi/run.ts dispatches by tool name.

import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { BLOCKS_MANIFEST } from '@/lib/blocks-manifest.generated';
import { WIDGETS_MANIFEST } from '@/lib/widgets-manifest.generated';
import { DesignTokensSchema } from '@/lib/tokens';
import { enforceTokenContrast } from '@/lib/contrast';
import { MOODS, type MoodKey } from '@/lib/moods';
import {
  generateHeroImage,
  generateAboutImage,
  generateProductImage,
} from '@/lib/fal';
import { logger } from '@/lib/logger';
import { labelFor, type ProgressEmitter, type ProgressStep } from '@/lib/progress';
import { inferGenderFromName } from '@/lib/name-gender';
import { sanitizeDeep } from '@/lib/copy-sanitize';
import type { BohdiAccumulator, BohdiBrief } from './types';

// ─── Tool definitions for the Anthropic API ──────────────────────────────────

export interface BohdiToolDef {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const BOHDI_TOOLS: BohdiToolDef[] = [
  {
    name: 'read_niche',
    description:
      "Read the niche the maker chose. Returns the prose body (context about the business, customers, vocabulary) and a style sheet (named palette, fonts, textures — no role assignments). Call this once early.",
    input_schema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'The niche slug (e.g. "leatherworker").' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'read_mood',
    description:
      "Read the mood the maker chose. Returns the mood label, audience description, and a style sheet (named palette, fonts, textures — no role assignments). Call this once early.",
    input_schema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'The mood key (e.g. "dark", "sunset", "simple").' },
      },
      required: ['key'],
    },
  },
  {
    name: 'list_blocks',
    description:
      "List the blocks available for a page type. Returns each block's key, structural description, slots, and content schema. Bohdi composes pages by picking from this list.",
    input_schema: {
      type: 'object',
      properties: {
        pageType: {
          type: 'string',
          enum: ['home', 'shop', 'contact'],
          description: 'Which page Bohdi is composing.',
        },
      },
      required: ['pageType'],
    },
  },
  {
    name: 'list_widgets',
    description:
      'List the widgets available to thread into block slots. Returns each widget\'s key, description, accepted slot keys, and content schema.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'log_decision',
    description:
      "Log a design decision Bohdi made. Call this for every meaningful choice — palette role assignment, font pairing, block pick, copy direction, image brief, composition. Provide at least 2 candidates with reasoning per candidate, the picked one, and overall reasoning. The log is permanent and visible to Alex.",
    input_schema: {
      type: 'object',
      properties: {
        decisionType: {
          type: 'string',
          description:
            'A short type label (e.g. "palette-role-assignment", "font-pairing", "block-pick", "copy-headline", "image-brief", "composition").',
        },
        candidates: {
          type: 'array',
          description:
            'At least 2 candidates Bohdi considered. Each is an object describing the candidate and including a "reasoning" field.',
          items: { type: 'object' },
          minItems: 2,
        },
        picked: {
          type: 'object',
          description: 'The candidate Bohdi chose. Same shape as one element of candidates.',
        },
        reasoning: {
          type: 'string',
          description:
            'Bohdi\'s overall reasoning for choosing the picked candidate over the others.',
        },
      },
      required: ['decisionType', 'candidates', 'picked', 'reasoning'],
    },
  },
  {
    name: 'generate_image',
    description:
      "Generate an image via fal (FLUX Pro). Returns a URL once the image is uploaded to storage. Use kind 'hero' for the home page hero (landscape), 'about' for the about-maker portrait, 'product' for product photos (square), 'subscription' for subscription previews (square). The prompt should be a vivid description of the desired image. No text in images.",
    input_schema: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['hero', 'about', 'product', 'subscription'] },
        prompt: { type: 'string', description: 'Detailed visual description for the image model.' },
        slug: {
          type: 'string',
          description:
            'For product/subscription kinds: the slug used in the storage path. For hero/about: ignored.',
        },
      },
      required: ['kind', 'prompt'],
    },
  },
  {
    name: 'set_tokens',
    description:
      "Set the design tokens for the storefront. Bohdi calls this once after deciding palette roles, fonts, shape, spacing, and layout. The schema is strict — every field is required.",
    input_schema: {
      type: 'object',
      properties: {
        colors: {
          type: 'object',
          properties: {
            primary: { type: 'string' },
            accent: { type: 'string' },
            background: { type: 'string' },
            surface: { type: 'string' },
            text: { type: 'string' },
            textMuted: { type: 'string' },
            border: { type: 'string' },
          },
          required: ['primary', 'accent', 'background', 'surface', 'text', 'textMuted', 'border'],
        },
        typography: {
          type: 'object',
          properties: {
            headingFont: { type: 'string' },
            bodyFont: { type: 'string' },
            headingWeight: { type: 'integer' },
            headingLetterSpacing: { type: 'string' },
            bodyLineHeight: { type: 'string' },
            baseSize: { type: 'string' },
          },
          required: [
            'headingFont',
            'bodyFont',
            'headingWeight',
            'headingLetterSpacing',
            'bodyLineHeight',
            'baseSize',
          ],
        },
        wordmark: {
          type: 'object',
          description:
            "The shop wordmark is the identity element in the nav. Pick a display font that's distinct from the heading font — this is the visual signature of the shop. Pick a treatment that fits the mood and niche. For solid/outline, color2 must be empty string ''.",
          properties: {
            font: { type: 'string', description: 'Google Font name — a display font, distinct from headingFont.' },
            treatment: {
              type: 'string',
              enum: ['solid', 'gradient', 'outline', 'two-tone'],
              description:
                "solid = single color. gradient = linear gradient color1 → color2. outline = stroked text, no fill (color1 is the stroke). two-tone = first word in color1, rest in color2 (best for 2-word shop names).",
            },
            color1: { type: 'string', description: 'Hex. Always used.' },
            color2: { type: 'string', description: "Hex. Used by gradient and two-tone; empty string '' for solid/outline." },
            letterSpacing: { type: 'string', description: 'e.g. -0.03em for tight display, 0.08em for spaced caps.' },
          },
          required: ['font', 'treatment', 'color1', 'color2', 'letterSpacing'],
        },
        shape: {
          type: 'object',
          properties: {
            borderRadius: { type: 'string', enum: ['none', 'sm', 'md', 'lg', 'full'] },
            cardBorderRadius: { type: 'string', enum: ['none', 'sm', 'md', 'lg', 'full'] },
          },
          required: ['borderRadius', 'cardBorderRadius'],
        },
        spacing: {
          type: 'object',
          properties: {
            sectionPadding: { type: 'string', enum: ['compact', 'normal', 'spacious'] },
            cardGap: { type: 'string', enum: ['tight', 'normal', 'loose'] },
          },
          required: ['sectionPadding', 'cardGap'],
        },
        layout: {
          type: 'object',
          properties: {
            heroStyle: { type: 'string', enum: ['full-bleed', 'contained', 'split'] },
            productGridCols: { type: 'integer', enum: [2, 3, 4] },
            footerStyle: { type: 'string', enum: ['minimal', 'standard', 'rich'] },
          },
          required: ['heroStyle', 'productGridCols', 'footerStyle'],
        },
      },
      required: ['colors', 'typography', 'wordmark', 'shape', 'spacing', 'layout'],
    },
  },
  {
    name: 'set_home_page',
    description:
      "Set the home page blocks. Each block has a blockKey from list_blocks, a position (0-based), a content object matching the block's content schema, and optional slots. Slots map slot keys (e.g. 'primary-cta') to widget instances, each shaped as { widgetKey: string, content: object } — the widgetKey field name is required exactly. Nav and footer are auto-injected — do NOT include them. The first block should be a hero. Include a products block. 4-6 blocks total.",
    input_schema: {
      type: 'object',
      properties: {
        blocks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              blockKey: { type: 'string' },
              position: { type: 'integer' },
              content: { type: 'object' },
              slots: {
                type: 'object',
                description:
                  'Map of slot key to widget instance. Each value MUST be shaped { widgetKey: "<widget key from list_widgets>", content: { ... } }. Do not use "key" — the renderer looks for "widgetKey".',
                additionalProperties: {
                  type: 'object',
                  properties: {
                    widgetKey: { type: 'string' },
                    content: { type: 'object' },
                  },
                  required: ['widgetKey', 'content'],
                },
              },
            },
            required: ['blockKey', 'position', 'content'],
          },
        },
      },
      required: ['blocks'],
    },
  },
  {
    name: 'set_secondary_pages_copy',
    description:
      "Set the copy for the auto-built /shop and /contact pages. The pages themselves are platform-built; Bohdi just writes the headings.",
    input_schema: {
      type: 'object',
      properties: {
        shop: {
          type: 'object',
          properties: {
            eyebrow: { type: 'string' },
            heading: { type: 'string' },
            subheading: { type: 'string' },
          },
          required: ['eyebrow', 'heading', 'subheading'],
        },
        contact: {
          type: 'object',
          properties: {
            heading: { type: 'string' },
            subheading: { type: 'string' },
            buttonLabel: { type: 'string' },
          },
          required: ['heading', 'subheading', 'buttonLabel'],
        },
      },
      required: ['shop', 'contact'],
    },
  },
  {
    name: 'add_collection',
    description:
      "Add a sample collection to the storefront. Use only if collections fit this niche (groupings of products that naturally belong together). 0-4 collections total. Bohdi may also add zero.",
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        slug: { type: 'string', description: 'URL-safe lowercase with hyphens.' },
        description: { type: 'string' },
      },
      required: ['name', 'slug', 'description'],
    },
  },
  {
    name: 'add_listing',
    description:
      "Add a product listing. The image_url field must be a URL returned by generate_image (call that first). collection_slug must match a slug from a previously added collection, or null.",
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        slug: { type: 'string' },
        short_description: { type: 'string' },
        description: { type: 'string' },
        base_price_cents: { type: 'integer' },
        image_url: { type: ['string', 'null'] },
        collection_slug: { type: ['string', 'null'] },
      },
      required: [
        'name',
        'slug',
        'short_description',
        'description',
        'base_price_cents',
        'image_url',
        'collection_slug',
      ],
    },
  },
  {
    name: 'add_subscription',
    description:
      "Add a sample subscription. Only use for niches where a recurring small-item delivery makes sense (candles, soap, tea, baked goods, flowers). Skip for slow-production niches (leather, furniture, ceramics, jewelry). 0-2 total.",
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        slug: { type: 'string' },
        short_description: { type: 'string' },
        description: { type: 'string' },
        base_price_cents: { type: 'integer' },
        subscription_interval: { type: 'string', enum: ['week', 'month', 'quarter'] },
        image_url: { type: ['string', 'null'] },
      },
      required: [
        'name',
        'slug',
        'short_description',
        'description',
        'base_price_cents',
        'subscription_interval',
        'image_url',
      ],
    },
  },
  {
    name: 'set_hero_image',
    description: 'Set the home page hero background image URL. The URL must come from generate_image with kind=hero.',
    input_schema: {
      type: 'object',
      properties: { url: { type: 'string' } },
      required: ['url'],
    },
  },
  {
    name: 'set_about_image',
    description: 'Set the about image URL (optional). The URL must come from generate_image with kind=about. The image is shared between the home about block and the /about page.',
    input_schema: {
      type: 'object',
      properties: { url: { type: 'string' } },
      required: ['url'],
    },
  },
  {
    name: 'set_about_page',
    description:
      "Set the content for the dedicated /about page (separate from the home page about block). This is the expanded story — the maker's full origin, philosophy, process. It must be substantially LONGER and DISTINCT from the home about block, not a paraphrase. The home about is a teaser; this is the real article. Body should be 1500-3500 chars across multiple paragraphs separated by blank lines.",
    input_schema: {
      type: 'object',
      properties: {
        eyebrow: { type: 'string', description: 'Small label above the page headline, e.g. "Our Story", "The Maker". Optional but recommended.' },
        headline: { type: 'string', description: 'The /about page\'s main headline — title of the page (under 80 chars).' },
        intro: { type: 'string', description: 'Lead paragraph that sets up the story. 1-2 sentences, 300-500 chars.' },
        body: { type: 'string', description: 'The long body of the story. Multiple paragraphs separated by blank lines. 1500-3500 chars. Must NOT repeat the home about block — this is the expanded version, deeper and richer.' },
        signatureName: { type: 'string', description: 'Optional signature name at the bottom (typically the maker\'s first name).' },
        signatureRole: { type: 'string', description: 'Optional role line under the signature.' },
      },
      required: ['eyebrow', 'headline', 'intro', 'body', 'signatureName', 'signatureRole'],
    },
  },
  {
    name: 'finalize',
    description:
      "Commit everything Bohdi has built to the database. Call this only after tokens, home page blocks, secondary page copy, about page content, hero image, and all listings are set. Returns the tenant ID. After this, Bohdi's job is done.",
    input_schema: { type: 'object', properties: {} },
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i] as T;
    copy[i] = copy[j] as T;
    copy[j] = tmp;
  }
  return copy;
}

// ─── Style sheet loading ─────────────────────────────────────────────────────

function loadStyleSheet(filename: string): unknown {
  const p = path.join(process.cwd(), 'content', 'style-sheets', filename);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

// ─── Tool handlers ───────────────────────────────────────────────────────────

type Handler = (args: unknown, ctx: HandlerContext) => Promise<unknown>;

export interface HandlerContext {
  brief: BohdiBrief;
  accumulator: BohdiAccumulator;
  /** Set by the finalize handler so the loop knows to exit. */
  done: { value: boolean; result: { tenantId: string; subdomain: string } | null };
  /** Tenant ID once known (after finalize) — used to backfill design_choices rows. */
  tenantIdRef: { value: string | null };
  /** Optional progress emitter — handlers call this to stream maker-facing status. */
  onProgress?: ProgressEmitter | undefined;
}

const handlers: Record<string, Handler> = {
  async read_niche(args, _ctx) {
    const { slug } = args as { slug: string };
    const { data, error } = await supabaseAdmin()
      .from('niches')
      .select('display_name, body_markdown, tenant_type_fit')
      .eq('slug', slug)
      .single();
    if (error || !data) throw new Error(`Niche not found: ${slug}`);
    return {
      slug,
      displayName: data.display_name,
      tenantTypeFit: data.tenant_type_fit,
      bodyMarkdown: data.body_markdown,
      styleSheet: loadStyleSheet(`niche-${slug}.json`),
    };
  },

  async read_mood(args, _ctx) {
    const { key } = args as { key: string };
    const mood = MOODS[key as MoodKey];
    if (!mood) throw new Error(`Mood not found: ${key}`);
    return {
      key: mood.key,
      label: mood.label,
      description: mood.description,
      styleSheet: loadStyleSheet(`mood-${key}.json`),
    };
  },

  async list_blocks(args, _ctx) {
    const { pageType } = args as { pageType: string };
    const active = BLOCKS_MANIFEST.filter(
      (b) => b.status === 'active' && b.pageTypes.includes(pageType as 'home') && b.sectionType !== 'nav' && b.sectionType !== 'footer',
    ).filter((b) => b.key !== 'events-list');
    // Shuffle variants within each sectionType so list order doesn't bias
    // Bohdi toward whatever block sorts first alphabetically.
    const heroes = shuffled(active.filter((b) => b.sectionType === 'hero'));
    const products = shuffled(active.filter((b) => b.sectionType === 'products'));
    const others = shuffled(active.filter((b) => b.sectionType !== 'hero' && b.sectionType !== 'products'));
    return [...heroes, ...products, ...others].map((b) => ({
      key: b.key,
      sectionType: b.sectionType,
      description: b.description,
      slots: b.slots,
      contentSchema: b.contentSchema.filter((f) => f.aiGenerated),
    }));
  },

  async list_widgets(_args, _ctx) {
    return WIDGETS_MANIFEST.filter((w) => w.status === 'active').map((w) => ({
      key: w.key,
      description: w.description,
      slotAccepts: w.slotAccepts,
      contentSchema: w.contentSchema.filter((f) => f.aiGenerated),
    }));
  },

  async log_decision(args, ctx) {
    const schema = z.object({
      decisionType: z.string(),
      candidates: z.array(z.unknown()).min(2),
      picked: z.unknown(),
      reasoning: z.string(),
    });
    const parsed = schema.parse(args);
    const row = {
      tenant_id: ctx.tenantIdRef.value,
      decision_type: parsed.decisionType,
      candidates: parsed.candidates,
      picked: parsed.picked,
      reasoning: parsed.reasoning,
      niche_slug: ctx.brief.nicheSlug,
      mood_key: ctx.brief.moodKey,
    };
    // design_choices is too new to be in the generated Database types; cast for now.
    const db = supabaseAdmin() as unknown as {
      from: (t: string) => {
        insert: (r: unknown) => {
          select: (c: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> };
        };
      };
    };
    const { data, error } = await db.from('design_choices').insert(row).select('id').single();
    if (error) throw new Error(`log_decision failed: ${error.message}`);
    return { id: data?.id ?? null };
  },

  async generate_image(args, ctx) {
    const { kind, prompt, slug } = args as {
      kind: 'hero' | 'about' | 'product' | 'subscription';
      prompt: string;
      slug?: string;
    };
    const subdomain = ctx.brief.subdomain;
    const moodSignal = {
      nicheSlug: ctx.brief.nicheSlug,
      moodKey: ctx.brief.moodKey,
      moodLabel: MOODS[ctx.brief.moodKey as MoodKey]?.label,
      moodDescription: MOODS[ctx.brief.moodKey as MoodKey]?.description,
      gender: inferGenderFromName(ctx.brief.makerName),
    };
    // Emit a kind-specific status before the fal call. The image generation
    // is the longest single step in Bohdi's run; the maker should see what
    // he's working on while it runs.
    const stepByKind: Record<typeof kind, ProgressStep> = {
      hero: 'generating-hero-image',
      about: 'generating-about-image',
      product: 'generating-product-image',
      subscription: 'generating-product-image',
    };
    const step = stepByKind[kind];
    if (ctx.onProgress) {
      ctx.onProgress({ type: 'status', step, label: labelFor(step, ctx.brief.makerName) });
    }
    let url: string | null = null;
    if (kind === 'hero') {
      url = await generateHeroImage(ctx.brief.nicheSlug, subdomain, moodSignal);
    } else if (kind === 'about') {
      url = await generateAboutImage(ctx.brief.nicheSlug, subdomain, moodSignal);
    } else {
      if (!slug) throw new Error(`generate_image kind=${kind} requires slug`);
      const folder = kind === 'subscription' ? `subscriptions/${slug}` : slug;
      url = await generateProductImage(
        slug, // pass slug as productName when Bohdi prompts directly
        prompt,
        ctx.brief.nicheSlug,
        subdomain,
        folder,
        moodSignal,
      );
    }
    if (!url) throw new Error(`generate_image kind=${kind} returned no URL`);
    return { url };
  },

  async set_tokens(args, ctx) {
    const parsed = DesignTokensSchema.parse(args);
    // Trust Bohdi's accent pick (he chose it deliberately from the style sheet),
    // but enforce text contrast against background, surface, and primary.
    const tokens = enforceTokenContrast(parsed, { skipAccent: true });
    ctx.accumulator.tokens = tokens;
    return { ok: true };
  },

  async set_home_page(args, ctx) {
    const { blocks } = args as { blocks: Array<{ blockKey: string; position: number; content: Record<string, string>; slots?: Record<string, unknown> }> };
    ctx.accumulator.homePage = blocks.map((b) => ({
      blockKey: b.blockKey,
      position: b.position,
      content: b.content,
      slots: (b.slots ?? {}) as Record<string, { widgetKey: string; content: Record<string, string> }>,
    }));
    return { ok: true };
  },

  async set_secondary_pages_copy(args, ctx) {
    const { shop, contact } = args as {
      shop: { eyebrow: string; heading: string; subheading: string };
      contact: { heading: string; subheading: string; buttonLabel: string };
    };
    ctx.accumulator.shopPageCopy = shop;
    ctx.accumulator.contactPageCopy = contact;
    return { ok: true };
  },

  async add_collection(args, ctx) {
    const c = args as { name: string; slug: string; description: string };
    ctx.accumulator.collections.push(c);
    return { ok: true, count: ctx.accumulator.collections.length };
  },

  async add_listing(args, ctx) {
    const l = args as {
      name: string;
      slug: string;
      short_description: string;
      description: string;
      base_price_cents: number;
      image_url: string | null;
      collection_slug: string | null;
    };
    ctx.accumulator.listings.push({
      ...l,
      image_prompt: '', // not used downstream once image_url is set
    });
    return { ok: true, count: ctx.accumulator.listings.length };
  },

  async add_subscription(args, ctx) {
    const s = args as {
      name: string;
      slug: string;
      short_description: string;
      description: string;
      base_price_cents: number;
      subscription_interval: 'week' | 'month' | 'quarter';
      image_url: string | null;
    };
    ctx.accumulator.subscriptions.push({
      ...s,
      image_prompt: '',
    });
    return { ok: true, count: ctx.accumulator.subscriptions.length };
  },

  async set_hero_image(args, ctx) {
    const { url } = args as { url: string };
    ctx.accumulator.heroImageUrl = url;
    return { ok: true };
  },

  async set_about_image(args, ctx) {
    const { url } = args as { url: string };
    ctx.accumulator.aboutImageUrl = url;
    return { ok: true };
  },

  async set_about_page(args, ctx) {
    const a = args as {
      eyebrow: string;
      headline: string;
      intro: string;
      body: string;
      signatureName: string;
      signatureRole: string;
    };
    ctx.accumulator.aboutPageContent = {
      eyebrow: a.eyebrow,
      headline: a.headline,
      intro: a.intro,
      body: a.body,
      signatureName: a.signatureName,
      signatureRole: a.signatureRole,
    };
    return { ok: true };
  },

  async finalize(_args, ctx) {
    const a = ctx.accumulator;
    if (!a.tokens) throw new Error('finalize: tokens not set');
    if (!a.homePage) throw new Error('finalize: home page not set');
    if (!a.shopPageCopy || !a.contactPageCopy) throw new Error('finalize: secondary pages copy not set');
    if (!a.heroImageUrl) throw new Error('finalize: hero image not set');

    // Scrub AI-tell punctuation (em-dashes, semicolons, parenthetical asides)
    // from all text fields before they hit the database. Bohdi's prompt asks
    // him to avoid them, but the model rationalizes past the instruction;
    // this is the floor that catches what the prompt can't.
    a.homePage = sanitizeDeep(a.homePage);
    a.shopPageCopy = sanitizeDeep(a.shopPageCopy);
    a.contactPageCopy = sanitizeDeep(a.contactPageCopy);
    a.aboutPageContent = sanitizeDeep(a.aboutPageContent);
    a.collections = sanitizeDeep(a.collections);
    a.listings = sanitizeDeep(a.listings);
    a.subscriptions = sanitizeDeep(a.subscriptions);

    // Use the same write path as the legacy generator. Import here to keep
    // the module graph clean.
    const { writeStorefront } = await import('@/lib/generation/write-storefront');
    const { BLOCKS_MANIFEST } = await import('@/lib/blocks-manifest.generated');

    // Inject hero image into the hero block.
    const heroBlock = a.homePage.find((b) => {
      const m = BLOCKS_MANIFEST.find((x) => x.key === b.blockKey);
      return m?.sectionType === 'hero';
    });
    if (!heroBlock) throw new Error('finalize: no hero block in home page');
    const heroManifest = BLOCKS_MANIFEST.find((m) => m.key === heroBlock.blockKey);
    const imageField = heroManifest?.contentSchema.find((f) => f.type === 'image' && !f.aiGenerated);
    const imageFieldKey = imageField?.key ?? 'backgroundImageUrl';
    heroBlock.content[imageFieldKey] = a.heroImageUrl;

    // Inject about image if Bohdi included an about-maker block.
    if (a.aboutImageUrl) {
      const aboutBlock = a.homePage.find((b) => b.blockKey === 'about-maker');
      if (aboutBlock) aboutBlock.content['imageUrl'] = a.aboutImageUrl;
    }

    // Look up niche tenant_type_fit (we need it for the write call).
    const { data: niche } = await supabaseAdmin()
      .from('niches')
      .select('tenant_type_fit')
      .eq('slug', ctx.brief.nicheSlug)
      .single();
    const tenantTypes = niche?.tenant_type_fit ?? ['seller'];

    // Build nav + footer with sections derived from what Bohdi put on the home page.
    const homeSectionTypes: string[] = a.homePage
      .map((b) => BLOCKS_MANIFEST.find((m) => m.key === b.blockKey)?.sectionType)
      .filter((s): s is NonNullable<typeof s> => s !== undefined);
    const hasCollections = a.collections.length > 0;
    const hasSubscriptions = a.subscriptions.length > 0;

    // Order rule (hard): shop first, conditional items in the middle,
    // about second-to-last, contact last. shop, about, contact are all
    // always present in both nav and footer — they are baseline.
    const conditionals: string[] = [];
    if (hasCollections) conditionals.push('collections');
    if (hasSubscriptions) conditionals.push('subscriptions');
    if (homeSectionTypes.includes('events')) conditionals.push('events');

    const navSections: string[] = ['shop', ...conditionals, 'about', 'contact'];
    const footerSections: string[] = ['shop', ...conditionals, 'about', 'contact'];

    const logoUrl = ctx.brief.logoUrl ?? '';
    const navBlock = {
      blockKey: 'nav-centered-wordmark',
      position: -1,
      content: { shopName: ctx.brief.shopName, sections: JSON.stringify(navSections), logoUrl },
      slots: {} as Record<string, { widgetKey: string; content: Record<string, string> }>,
    };
    const footerBlock = {
      blockKey: 'footer-classic',
      position: 9999,
      content: { shopName: ctx.brief.shopName, sections: JSON.stringify(footerSections) },
      slots: {} as Record<string, { widgetKey: string; content: Record<string, string> }>,
    };

    const homePageBlocks = [
      navBlock,
      ...a.homePage.map((b, i) => ({ ...b, position: i })),
      footerBlock,
    ];

    const shopPageBlocks = [
      navBlock,
      {
        blockKey: 'page-intro',
        position: 0,
        content: { ...a.shopPageCopy },
        slots: {} as Record<string, { widgetKey: string; content: Record<string, string> }>,
      },
      {
        blockKey: 'products-shop-grid',
        position: 1,
        content: {},
        slots: {} as Record<string, { widgetKey: string; content: Record<string, string> }>,
      },
      footerBlock,
    ];

    const contactPageBlocks = [
      navBlock,
      {
        blockKey: 'contact-form',
        position: 0,
        content: { ...a.contactPageCopy },
        slots: {} as Record<string, { widgetKey: string; content: Record<string, string> }>,
      },
      footerBlock,
    ];

    if (!a.aboutPageContent) throw new Error('finalize: about page content not set');
    const aboutPageBlocks = [
      navBlock,
      {
        blockKey: 'about-story',
        position: 0,
        content: {
          ...a.aboutPageContent,
          imageUrl: a.aboutImageUrl ?? '',
        },
        slots: {} as Record<string, { widgetKey: string; content: Record<string, string> }>,
      },
      footerBlock,
    ];

    const result = await writeStorefront({
      subdomain: ctx.brief.subdomain,
      shopName: ctx.brief.shopName,
      nicheSlug: ctx.brief.nicheSlug,
      moodKey: ctx.brief.moodKey,
      tenantTypes,
      tokens: a.tokens,
      pages: [
        { slug: '/', pageType: 'home', title: ctx.brief.shopName, blocks: homePageBlocks },
        { slug: '/shop', pageType: 'shop', title: `${ctx.brief.shopName} — Shop`, blocks: shopPageBlocks },
        { slug: '/about', pageType: 'about', title: `${ctx.brief.shopName} — About`, blocks: aboutPageBlocks },
        { slug: '/contact', pageType: 'contact', title: `${ctx.brief.shopName} — Contact`, blocks: contactPageBlocks },
      ],
      collections: a.collections,
      listings: a.listings,
      subscriptions: a.subscriptions,
      logoUrl,
    });

    ctx.tenantIdRef.value = result.tenantId;
    ctx.done.value = true;
    ctx.done.result = result;

    // Backfill design_choices.tenant_id for rows logged before the tenant existed.
    const dbUpdate = supabaseAdmin() as unknown as {
      from: (t: string) => {
        update: (r: unknown) => {
          is: (col: string, val: unknown) => {
            eq: (col: string, val: unknown) => { eq: (col: string, val: unknown) => Promise<unknown> };
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

    logger.info('bohdi: finalize', { tenantId: result.tenantId, subdomain: result.subdomain });
    return { tenantId: result.tenantId, subdomain: result.subdomain };
  },
};

export async function dispatchTool(
  name: string,
  args: unknown,
  ctx: HandlerContext,
): Promise<unknown> {
  const handler = handlers[name];
  if (!handler) throw new Error(`Unknown tool: ${name}`);
  return handler(args, ctx);
}
