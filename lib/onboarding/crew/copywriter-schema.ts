/**
 * What the Copywriter produces: every WORD of the store. It does NOT carry the
 * Moment scene, the founder photo prompt, or product image prompts — those are
 * the Cinematographer's and Graphic Artist's jobs, assembled in later. It also
 * does NOT carry any structural picks — nav layout, hero variant, goods /
 * collections / reviews / find-us / founder treatments are ALL the family's
 * call. Bohdi authors CONTENT ONLY (§1.5).
 *
 * SCHEMA POLICY (D53 sharpened): this schema validates SHAPE — the right fields,
 * the right types, the right enums. It does NOT enforce length on any string,
 * and it does NOT reject content for punctuation or formatting. The build NEVER
 * fails because copy was too long, too short, or punctuated wrong. The
 * normalize step (normalize-copy.ts) strips terminal punctuation from headlines
 * and story lines and slugifies slugs without throwing; the renderer absorbs
 * any length via CSS (line-clamp on cards, ellipsis on labels, natural wrap on
 * headlines). The maker can also edit anything in the dashboard post-build.
 *
 * Floors are .min(1) — a required string can't be EMPTY (an empty button label
 * would render an unclickable target) — but anything non-empty is accepted. The
 * Copywriter prompt still names target lengths so generation stays punchy; the
 * schema just no longer enforces them.
 */
import { z } from 'zod';
import { FindUsRow } from '@/lib/archetypes/main-street/schemas';
import { LINK_TARGETS } from '@/lib/archetypes/main-street/links';
import { FINDUS_KINDS } from '@/lib/archetypes/main-street/findus';

/** A product's words only — no imagePrompt (the Graphic Artist adds that). */
export const ProductDraftSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  shortDescription: z.string().min(1),
  description: z.string().min(1),
  basePriceCents: z.number().int().min(1),
});
export type ProductDraft = z.infer<typeof ProductDraftSchema>;

export const CopywriterDraftSchema = z.object({
  shopName: z.string().min(1),
  identity: z.object({
    wordmark: z.string().min(1),
  }),
  moment: z.object({
    story: z.array(z.string().min(1)).min(1),
    eyebrow: z.string().min(1),
    brand: z.string().min(1),
    /** The shared hero SUB-LINE — one plain supporting sentence under the headline.
     *  Required: it is the pile ingredient every non-Story hero (Split, Stacked,
     *  Typographic, Floating card, Editorial cover) reads, so a build can't
     *  complete without it. Story uses its fading `story` lines and ignores this. */
    sub: z.string().min(1),
    ctaLabel: z.string().min(1),
    ctaTarget: z.enum(LINK_TARGETS),
    secondaryCtaLabel: z.string().min(1).optional(),
    secondaryCtaTarget: z.enum(LINK_TARGETS).optional(),
  }),
  goods: z.object({
    title: z.string().min(1),
    label: z.string().min(1).optional(),
    viewAllLabel: z.string().min(1).optional(),
  }),
  /** The collections beat + PAGE — the copywriter authors 3 niche-appropriate
   *  collections every build (build all sections at onboarding), and the build
   *  persists them as real `collections` DB rows the maker edits later. The band
   *  on the home is a teaser; /collections shows the full set; /collections/[slug]
   *  shows the pieces in one. Optional in the schema so legacy content still
   *  parses; new builds always author. */
  collections: z
    .object({
      title: z.string().min(1),
      label: z.string().min(1).optional(),
      viewAllLabel: z.string().min(1).optional(),
      items: z
        .array(
          z.object({
            name: z.string().min(1),
            description: z.string().min(1),
            slug: z.string().min(1),
          }),
        )
        .min(1),
    })
    .optional(),
  /** The marquee band's VOICE line — a few punchy brand phrases the scrolling
   *  band shows. Authored every build (build all sections at onboarding) so the
   *  band is ready whenever a family/maker turns it on; its second line (live
   *  logistics) is assembled from store data at render, not authored here. */
  marquee: z.object({
    voice: z.array(z.string().min(1)).min(1),
  }),
  /** The reviews beat — the maker's testimonials, authored every build (build all
   *  sections at onboarding) so the beat is ready whenever a family turns it on.
   *  These are SEEDED placeholder testimonials the maker edits or replaces, exactly
   *  like the sample find-us dates (D38) — plausible, in the shop's voice, NOT
   *  labeled "sample". `summary` feeds the rating treatment's aggregate. The
   *  copywriter authors CONTENT only — the treatment is a family-level look choice
   *  (like collections/nav), so it is not picked here; the dispatcher default holds
   *  until the family layer wires the per-family pick. */
  reviews: z.object({
    title: z.string().min(1),
    label: z.string().min(1).optional(),
    viewAllLabel: z.string().min(1).optional(),
    summary: z
      .object({
        score: z.string().min(1),
        count: z.string().min(1),
      })
      .optional(),
    items: z
      .array(
        z.object({
          quote: z.string().min(1),
          author: z.string().min(1),
          location: z.string().min(1).optional(),
        }),
      )
      .min(1),
  }),
  founder: z.object({
    quote: z.string().min(1),
    attribution: z.string().min(1),
    eyebrow: z.string().min(1).optional(),
    heading: z.string().min(1).optional(),
    aboutLabel: z.string().min(1).optional(),
    findUs: z
      .object({
        label: z.string().min(1),
        /** The Events page heading (the maker's own words). Optional so legacy
         *  content still parses; new builds always author it, so the page never
         *  falls back to a hardcoded English title. */
        title: z.string().min(1).optional(),
        eventsLabel: z.string().min(1).optional(),
        rows: z.array(FindUsRow).min(1),
      })
      .optional(),
  }),
  close: z.object({
    label: z.string().min(1),
    headline: z.string().min(1),
    ctaLabel: z.string().min(1),
    ctaTarget: z.enum(LINK_TARGETS),
  }),
  about: z.object({
    heading: z.string().min(1),
    story: z.array(z.string().min(1)).min(1),
  }),
  contact: z.object({
    heading: z.string().min(1),
    intro: z.string().min(1),
  }),
  products: z.array(ProductDraftSchema).min(1),
});
export type CopywriterDraft = z.infer<typeof CopywriterDraftSchema>;

/**
 * The JSON schema published to Anthropic as the `submit_copy` tool's input_schema.
 * Keeps the model's tool-call construction structurally grounded up front — a
 * missing required field or bad enum is caught by the SDK before we round-trip
 * through Zod, so a whole retry attempt isn't burned on the model omitting
 * `close.ctaTarget` or misspelling `moment.brand`.
 *
 * MUST MIRROR CopywriterDraftSchema above. Zod stays the runtime source of truth
 * — the normalize step runs off it, and the .min(1) floors it enforces are the
 * ones the build depends on. The JSON schema is intentionally shape-only: no
 * length caps, no punctuation rules (D53/D57 — the schema layer never fails on
 * copy formatting; normalize + renderer handle any length).
 */
export const COPY_TOOL_INPUT_SCHEMA = {
  type: 'object',
  properties: {
    shopName: { type: 'string' },
    identity: {
      type: 'object',
      properties: {
        wordmark: { type: 'string' },
      },
      required: ['wordmark'],
    },
    moment: {
      type: 'object',
      properties: {
        story: { type: 'array', items: { type: 'string' }, minItems: 1 },
        eyebrow: { type: 'string' },
        brand: { type: 'string' },
        sub: { type: 'string' },
        ctaLabel: { type: 'string' },
        ctaTarget: { type: 'string', enum: [...LINK_TARGETS] },
        secondaryCtaLabel: { type: 'string' },
        secondaryCtaTarget: { type: 'string', enum: [...LINK_TARGETS] },
      },
      required: ['story', 'eyebrow', 'brand', 'sub', 'ctaLabel', 'ctaTarget'],
    },
    goods: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        label: { type: 'string' },
        viewAllLabel: { type: 'string' },
      },
      required: ['title'],
    },
    collections: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        label: { type: 'string' },
        viewAllLabel: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              slug: { type: 'string' },
            },
            required: ['name', 'description', 'slug'],
          },
          minItems: 1,
        },
      },
      required: ['title', 'items'],
    },
    marquee: {
      type: 'object',
      properties: {
        voice: { type: 'array', items: { type: 'string' }, minItems: 1 },
      },
      required: ['voice'],
    },
    reviews: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        label: { type: 'string' },
        viewAllLabel: { type: 'string' },
        summary: {
          type: 'object',
          properties: {
            score: { type: 'string' },
            count: { type: 'string' },
          },
          required: ['score', 'count'],
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quote: { type: 'string' },
              author: { type: 'string' },
              location: { type: 'string' },
            },
            required: ['quote', 'author'],
          },
          minItems: 1,
        },
      },
      required: ['title', 'items'],
    },
    founder: {
      type: 'object',
      properties: {
        quote: { type: 'string' },
        attribution: { type: 'string' },
        eyebrow: { type: 'string' },
        heading: { type: 'string' },
        aboutLabel: { type: 'string' },
        findUs: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            title: { type: 'string' },
            eventsLabel: { type: 'string' },
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  day: { type: 'string' },
                  where: { type: 'string' },
                  time: { type: 'string' },
                  date: { type: 'string' },
                  kind: { type: 'string', enum: [...FINDUS_KINDS] },
                },
                required: ['day', 'where', 'time'],
              },
              minItems: 1,
            },
          },
          required: ['label', 'rows'],
        },
      },
      required: ['quote', 'attribution'],
    },
    close: {
      type: 'object',
      properties: {
        label: { type: 'string' },
        headline: { type: 'string' },
        ctaLabel: { type: 'string' },
        ctaTarget: { type: 'string', enum: [...LINK_TARGETS] },
      },
      required: ['label', 'headline', 'ctaLabel', 'ctaTarget'],
    },
    about: {
      type: 'object',
      properties: {
        heading: { type: 'string' },
        story: { type: 'array', items: { type: 'string' }, minItems: 1 },
      },
      required: ['heading', 'story'],
    },
    contact: {
      type: 'object',
      properties: {
        heading: { type: 'string' },
        intro: { type: 'string' },
      },
      required: ['heading', 'intro'],
    },
    products: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          slug: { type: 'string' },
          shortDescription: { type: 'string' },
          description: { type: 'string' },
          basePriceCents: { type: 'integer' },
        },
        required: ['name', 'slug', 'shortDescription', 'description', 'basePriceCents'],
      },
      minItems: 1,
    },
  },
  required: [
    'shopName',
    'identity',
    'moment',
    'goods',
    'marquee',
    'reviews',
    'founder',
    'close',
    'about',
    'contact',
    'products',
  ],
} satisfies { type: 'object'; properties: Record<string, unknown>; required: string[] };
