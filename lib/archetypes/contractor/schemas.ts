/**
 * Contractor — the content shape for a hand-built, one-page contractor site
 * (lawn construction, hardscape, grading, trades that sell on photos of real
 * work and close on an estimate request). Every visible sentence is authored
 * content; the renderer adds only UI strings from CONTRACTOR_STRINGS.
 */
import { z } from 'zod';

const text = z.string().trim().min(1);
const url = z.string().url();

export const ContractorMediaSchema = z
  .object({
    kind: z.enum(['video', 'still']),
    url,
    /** Still frame shown before a video plays (and to reduced-motion visitors). */
    poster: url.optional(),
    alt: text,
  })
  .strict();

/**
 * Which design the site wears. `yard` (the default) is the Cut-Pro layout laid
 * like sod; `statement` opens on a full-width photo with the owner cut out and
 * oversized in front of it, breaking past the hero's bottom edge (Alex, 2026-10-06).
 */
export const CONTRACTOR_DESIGNS = ['yard', 'statement'] as const;
export type ContractorDesign = (typeof CONTRACTOR_DESIGNS)[number];

export const ContractorContentSchema = z
  .object({
    design: z.enum(CONTRACTOR_DESIGNS).optional(),
    business: z
      .object({
        name: text,
        /** The trade line under the wordmark, e.g. "Lawncare & Construction". */
        trade: text,
        /** Display form, e.g. "(401) 206-1566". */
        phone: text,
        /** Dialable form, e.g. "+14012061566". */
        phoneDial: z.string().regex(/^\+?[0-9]{7,15}$/),
        email: z.string().email().optional(),
        /** Where they work, in the order they're named, e.g. ["Rhode Island", …]. */
        serviceArea: z.array(text).min(1),
      })
      .strict(),
    hero: z
      .object({
        kicker: text,
        /** The hand-lettered line on the green brush stroke. */
        marker: text,
        headline: text,
        /** One word of the headline painted in the accent (must appear in it). */
        highlight: text.optional(),
        sub: text,
        media: ContractorMediaSchema,
        /** Statement design: the owner, background removed (a transparent image), stood large in front of `media`. */
        cutout: ContractorMediaSchema.optional(),
        estimateLabel: text,
      })
      .strict(),
    proof: z.array(z.object({ figure: text, label: text }).strict()).max(4).optional(),
    work: z
      .object({
        eyebrow: text,
        title: text,
        intro: text.optional(),
        items: z
          .array(
            z
              .object({ media: ContractorMediaSchema, caption: text, tag: text.optional() })
              .strict(),
          )
          .min(1),
      })
      .strict(),
    services: z
      .object({
        eyebrow: text,
        title: text,
        items: z.array(z.object({ name: text, detail: text }).strict()).min(1),
        note: text.optional(),
      })
      .strict(),
    reviews: z
      .object({
        eyebrow: text,
        title: text,
        items: z.array(z.object({ quote: text, author: text, job: text.optional() }).strict()).min(1),
        note: text.optional(),
      })
      .strict()
      .optional(),
    crew: z
      .object({
        eyebrow: text,
        quote: text,
        attribution: text,
        body: z.array(text).min(1),
        photo: ContractorMediaSchema,
        inset: z.object({ media: ContractorMediaSchema, caption: text }).strict().optional(),
      })
      .strict(),
    area: z.object({ eyebrow: text, title: text, intro: text }).strict(),
    estimate: z
      .object({
        eyebrow: text,
        title: text,
        intro: text,
        steps: z.array(text).max(4).optional(),
        /** The details box's placeholder, in the trade's own words (defaults to the lawn wording). */
        detailsHint: text.optional(),
        /** The State choices on the form (defaults to the service area). */
        states: z.array(text).min(1).optional(),
      })
      .strict(),
  })
  .strict();

export type ContractorContent = z.infer<typeof ContractorContentSchema>;
export type ContractorMedia = z.infer<typeof ContractorMediaSchema>;
