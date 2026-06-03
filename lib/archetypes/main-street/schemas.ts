/**
 * Main Street archetype — schemas.
 *
 * Main Street is the default maker shop: a hero, a featured selection of the
 * maker's goods, the maker's own story, optional supporting bands, and a footer.
 * It ships a curated family of arrangements (see MainStreet.tsx); the content
 * here is identical across arrangements, so a maker can switch format with one
 * click and nothing has to be re-authored.
 *
 * Niche-neutral by construction — every label and string is a content slot, so
 * the archetype never assumes a maker bakes, throws pots, or pours candles. The
 * same shop wears any niche by the words Bohdi writes into it.
 *
 * Every text field is capped (max) as well as floored (min) so Bohdi cannot
 * overflow the geometry the renderer assumes — the lesson from the broadsheet,
 * where an unbounded headline broke the display.
 */
import { z } from 'zod';
import { MAIN_STREET_THEMES } from './themes';
import { MAIN_STREET_ARRANGEMENTS } from './arrangements-meta';

/** Imagery slot: a prompt for generation, optionally a pre-resolved URL. */
const PhotoSlot = z.object({
  prompt: z.string().min(8).max(400),
  url: z.string().url().optional(),
  alt: z.string().min(4).max(120),
});

/** A footer link column. */
const FooterColumn = z.object({
  title: z.string().min(2).max(24),
  items: z.array(z.string().min(1).max(28)).min(2).max(5),
});

/**
 * The complete content contract for a Main Street store. Every tenant produces
 * exactly this shape, the same for every arrangement; the renderer structurally
 * cannot consume anything else.
 */
export const MainStreetContentSchema = z.object({
  /** The shop's actual name — used in the footer. */
  shopName: z.string().min(2).max(40),

  /** The top identity bar. */
  identity: z.object({
    /** The shop name as it reads in the wordmark (usually the shop name). */
    wordmark: z.string().min(2).max(28),
    /** One line of the maker's voice. */
    tagline: z.string().min(8).max(96),
    /** Top navigation labels. */
    nav: z.array(z.string().min(2).max(18)).min(2).max(4),
  }),

  /** The hero — the shop's face. Required. */
  hero: z.object({
    /** The headline. Renders large, so keep it tight. */
    headline: z.string().min(6).max(52),
    /** One supporting line under the headline. */
    sub: z.string().min(8).max(120),
    /** Primary call to action label. */
    ctaLabel: z.string().min(3).max(24),
    photo: PhotoSlot,
  }),

  /** Featured selection — just the section heading. The products are catalog
   *  rows passed to the renderer separately (the shared ProductView core). */
  featured: z.object({
    /** Short section heading, e.g. "Featured" or "What we make". */
    title: z.string().min(2).max(36),
  }),

  /** The maker — story and face. Required: the authority the platform is built on. */
  maker: z.object({
    /** Small eyebrow, like "The Studio" or "About". */
    label: z.string().min(2).max(24),
    /** The story hook headline. */
    headline: z.string().min(6).max(52),
    /** The story paragraph, in the maker's voice. */
    body: z.string().min(40).max(480),
    photo: PhotoSlot,
    ctaLabel: z.string().min(3).max(28),
  }),

  /** Optional supporting band — a note, what's new, where to find the maker.
   *  Niche-neutral: the maker decides what it says. Drops out if absent. */
  secondary: z
    .object({
      label: z.string().min(2).max(24),
      headline: z.string().min(4).max(52),
      body: z.string().min(12).max(280),
    })
    .optional(),

  /** Optional email-capture beat. Drops out if absent. */
  stayInTouch: z
    .object({
      headline: z.string().min(4).max(52),
      body: z.string().min(8).max(160),
      ctaLabel: z.string().min(3).max(24),
    })
    .optional(),

  /** Footer — a blurb and exactly two link columns. */
  footer: z.object({
    blurb: z.string().min(8).max(90),
    columns: z.array(FooterColumn).length(2),
  }),
});

export type MainStreetContent = z.infer<typeof MainStreetContentSchema>;

/**
 * The only theme choice Bohdi can make is which curated theme variant to wear.
 * Everything inside it — colors, fonts, scale, spacing, atmosphere, motion — is
 * the archetype's, not his.
 */
export const MainStreetThemeSchema = z.object({
  themeKey: z.enum(Object.keys(MAIN_STREET_THEMES) as [string, ...string[]]),
});
export type MainStreetThemePick = z.infer<typeof MainStreetThemeSchema>;

/** The arrangement (complete page composition) pick. */
export const MainStreetArrangementSchema = z.object({
  arrangement: z.enum(Object.keys(MAIN_STREET_ARRANGEMENTS) as [string, ...string[]]),
});
export type MainStreetArrangementPick = z.infer<typeof MainStreetArrangementSchema>;
