/**
 * What the Copywriter produces: every WORD of the store, and the two treatment
 * picks that decide which words exist (a "card" About beat needs an eyebrow and
 * heading; a "letter" needs a signed note). It does NOT carry the Moment scene,
 * the founder photo prompt, or product image prompts — those are the
 * Cinematographer's and Graphic Artist's jobs, assembled in later.
 *
 * Built from the SAME primitives as MainStreetContentSchema (imported, not
 * re-typed) so the limits can never drift from the engine that finally validates
 * the assembled envelope. Treatments and the about/contact pages are REQUIRED
 * here (the copywriter always authors them); the content schema leaves them
 * optional only to keep older stored rows parseable.
 */
import { z } from 'zod';
import { GOODS_TREATMENTS } from '@/lib/archetypes/main-street/goods';
import { StoryLine, FindUsRow, FOUNDER_TREATMENTS, NavItem } from '@/lib/archetypes/main-street/schemas';
import { LINK_TARGETS } from '@/lib/archetypes/main-street/links';

/** A product's words only — no imagePrompt (the Graphic Artist adds that). */
export const ProductDraftSchema = z.object({
  name: z.string().min(2).max(40),
  slug: z.string().min(2).max(48),
  shortDescription: z.string().min(4).max(90),
  description: z.string().min(12).max(600),
  basePriceCents: z.number().int().min(100).max(5_000_00),
});
export type ProductDraft = z.infer<typeof ProductDraftSchema>;

export const CopywriterDraftSchema = z.object({
  shopName: z.string().min(2).max(40),
  identity: z.object({
    // Up to 40 to hold the maker's full shop name verbatim (the pipeline forces
    // the wordmark to the real shop name; the crew never renames the shop).
    wordmark: z.string().min(2).max(40),
    // The crew authors each nav link as a label + a target page (D46), so the
    // word and the destination always agree. Objects are REQUIRED here (unlike
    // the tolerant content schema) — every NEW build must carry real targets.
    nav: z.array(NavItem).min(2).max(4),
  }),
  moment: z.object({
    story: z.array(StoryLine).min(2).max(4),
    eyebrow: z.string().min(4).max(48),
    brand: z.string().min(2).max(40),
    ctaLabel: z.string().min(3).max(24),
    // Where the primary hero button goes — authored alongside its label (D46).
    ctaTarget: z.enum(LINK_TARGETS),
    secondaryCtaLabel: z.string().min(3).max(24).optional(),
    secondaryCtaTarget: z.enum(LINK_TARGETS).optional(),
  }),
  goods: z.object({
    title: z.string().min(2).max(48),
    treatment: z.enum(GOODS_TREATMENTS),
    label: z.string().min(2).max(24).optional(),
    viewAllLabel: z.string().min(2).max(28).optional(),
  }),
  founder: z.object({
    quote: z.string().min(24).max(280),
    attribution: z.string().min(4).max(60),
    treatment: z.enum(FOUNDER_TREATMENTS),
    eyebrow: z.string().min(2).max(24).optional(),
    heading: z.string().min(2).max(28).optional(),
    aboutLabel: z.string().min(2).max(28).optional(),
    findUs: z
      .object({
        label: z.string().min(2).max(28),
        eventsLabel: z.string().min(2).max(28).optional(),
        rows: z.array(FindUsRow).min(1).max(5),
      })
      .optional(),
  }),
  close: z.object({
    label: z.string().min(2).max(28),
    headline: z.string().min(6).max(72),
    ctaLabel: z.string().min(3).max(24),
    // Where the close button goes — authored alongside its label (D46).
    ctaTarget: z.enum(LINK_TARGETS),
  }),
  about: z.object({
    heading: z.string().min(4).max(60),
    story: z.array(z.string().min(40).max(700)).min(2).max(5),
  }),
  contact: z.object({
    heading: z.string().min(4).max(48),
    intro: z.string().min(20).max(400),
  }),
  products: z.array(ProductDraftSchema).min(3).max(12),
});
export type CopywriterDraft = z.infer<typeof CopywriterDraftSchema>;
