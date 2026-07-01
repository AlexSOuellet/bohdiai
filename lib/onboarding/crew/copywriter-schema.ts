/**
 * What the Copywriter produces: every WORD of the store, and the two treatment
 * picks that decide which words exist (a "card" About beat needs an eyebrow and
 * heading; a "letter" needs a signed note). It does NOT carry the Moment scene,
 * the founder photo prompt, or product image prompts — those are the
 * Cinematographer's and Graphic Artist's jobs, assembled in later.
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
import { GOODS_TREATMENTS } from '@/lib/archetypes/main-street/goods';
import { FindUsRow, FOUNDER_TREATMENTS, NavItem } from '@/lib/archetypes/main-street/schemas';
import { LINK_TARGETS } from '@/lib/archetypes/main-street/links';

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
    nav: z.array(NavItem).min(1),
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
    treatment: z.enum(GOODS_TREATMENTS),
    label: z.string().min(1).optional(),
    viewAllLabel: z.string().min(1).optional(),
  }),
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
    treatment: z.enum(FOUNDER_TREATMENTS),
    eyebrow: z.string().min(1).optional(),
    heading: z.string().min(1).optional(),
    aboutLabel: z.string().min(1).optional(),
    findUs: z
      .object({
        label: z.string().min(1),
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
