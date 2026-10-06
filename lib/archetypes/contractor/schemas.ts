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
 * Which design the site wears — each its own page, sharing only this content
 * shape (Alex, 2026-10-06: custom sites must each look custom).
 * `yard` (the default): the Cut-Pro page, laid like sod.
 * `statement`: a home-magazine feature, the owner cut out on the cover.
 * `swatch`: a paint-chip card — color bands, the work as a deck of chips,
 * reviews on paint stir sticks. Work items carry their `swatch`.
 * `atelier`: quiet high-end editorial (Alex's Stitch reference, 2026-10-06) —
 * stone and serif, cards with icons and tags, a live ballpark `estimator`, a
 * "typical vs us" `comparison`, case-study job cards.
 * `harbor`: coastal navy and gold, Playfair over Plus Jakarta Sans (Alex's Stitch
 * reference for Joe, 2026-10-06) — the owner cut out over a photo cover, a
 * trust strip, the request form right after the top, photo service cards,
 * project cards, review cards, and the owner's `promises` panel.
 */
export const CONTRACTOR_DESIGNS = ['yard', 'statement', 'swatch', 'atelier', 'harbor'] as const;

/** A Material Symbols icon name, e.g. "verified_user". */
const icon = z.string().regex(/^[a-z0-9_]+$/);

/** Atelier design: tap the job, the size and the finish; a price range updates live. */
export const EstimatorSchema = z
  .object({
    eyebrow: text,
    title: text,
    intro: text,
    scopes: z.array(z.object({ key: z.string().regex(/^[a-z0-9-]+$/), name: text, detail: text, icon: icon.optional() }).strict()).min(2).max(6),
    sizes: z.array(z.object({ key: z.string().regex(/^[a-z0-9-]+$/), name: text }).strict()).min(2).max(4),
    grades: z.array(z.object({ key: z.string().regex(/^[a-z0-9-]+$/), name: text, detail: text, note: text }).strict()).min(2).max(4),
    /** "scope|size|grade" → the range shown, e.g. "$2,800 – $3,600". Every combination must be priced. */
    ranges: z.record(z.string(), text),
    /** Small print under the range, e.g. "Includes setup and prep". */
    rangeNote: text,
  })
  .strict()
  .superRefine((e, ctx) => {
    for (const s of e.scopes) for (const z2 of e.sizes) for (const g of e.grades) {
      const key = `${s.key}|${z2.key}|${g.key}`;
      if (e.ranges[key] === undefined) ctx.addIssue({ code: 'custom', path: ['ranges', key], message: 'unpriced combination' });
    }
  });
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
        /** Atelier and harbor designs: short trust badges, each with an icon (harbor: with a second line). */
        badges: z.array(z.object({ icon, label: text, sub: text.optional() }).strict()).max(4).optional(),
        /** Atelier design: the caption laid over the hero photo. */
        feature: z.object({ label: text, title: text, tag: text.optional() }).strict().optional(),
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
              .object({
                media: ContractorMediaSchema,
                caption: text,
                tag: text.optional(),
                /** Atelier design: where the job was, and a line about it. */
                place: text.optional(),
                detail: text.optional(),
                /** Swatch design: the job's main color and a paint-chip name for it. */
                swatch: z.object({ color: z.string().regex(/^#[0-9a-fA-F]{6}$/), name: text }).strict().optional(),
              })
              .strict(),
          )
          .min(1),
      })
      .strict(),
    services: z
      .object({
        eyebrow: text,
        title: text,
        items: z
          .array(
            z
              .object({
                name: text,
                detail: text,
                /** Harbor design: the icon beside the service's name. */
                icon: icon.optional(),
                /** Atelier design: a photo card with a label on it and a few tags under it. */
                photo: ContractorMediaSchema.optional(),
                label: text.optional(),
                tags: z.array(text).max(4).optional(),
              })
              .strict(),
          )
          .min(1),
        note: text.optional(),
      })
      .strict(),
    estimator: EstimatorSchema.optional(),
    /** Contractor Full: a short notice across the top of every page, e.g. "Now booking spring exteriors". */
    notice: text.optional(),
    /** Contractor Full: the booked-days calendar, months in the order to show, days as numbers. */
    calendar: z
      .object({
        eyebrow: text,
        title: text,
        intro: text.optional(),
        months: z
          .array(
            z
              .object({
                year: z.number().int().min(2024).max(2100),
                month: z.number().int().min(1).max(12),
                booked: z.array(z.number().int().min(1).max(31)),
              })
              .strict(),
          )
          .min(1)
          .max(3),
      })
      .strict()
      .optional(),
    /** Contractor Full: questions customers ask, answered. */
    faq: z
      .object({ eyebrow: text, title: text, items: z.array(z.object({ q: text, a: text }).strict()).min(1) })
      .strict()
      .optional(),
    /** Atelier design: the line above the closing call to action, e.g. a booking note. */
    banner: z.object({ label: text, text: text, tag: text.optional() }).strict().optional(),
    /** Atelier design: "typical painters vs us", one row per topic. */
    comparison: z
      .object({
        eyebrow: text,
        title: text,
        intro: text.optional(),
        themLabel: text,
        usLabel: text,
        rows: z.array(z.object({ topic: text, them: text, us: text }).strict()).min(1).max(5),
      })
      .strict()
      .optional(),
    reviews: z
      .object({
        eyebrow: text,
        title: text,
        items: z.array(z.object({ quote: text, author: text, job: text.optional() }).strict()).min(1),
        note: text.optional(),
        /** Atelier design: the overall rating line, only when it is true, e.g. { score: "4.5", label: "On Google" }. */
        rating: z.object({ score: text, label: text }).strict().optional(),
      })
      .strict()
      .optional(),
    crew: z
      .object({
        eyebrow: text,
        quote: text,
        attribution: text,
        body: z.array(text).min(1),
        /** Harbor design: what the owner promises, each with an icon — only what is true. */
        promises: z.array(z.object({ icon, title: text, text }).strict()).max(5).optional(),
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
