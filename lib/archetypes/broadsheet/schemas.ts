/**
 * Broadsheet archetype — schemas.
 *
 * Defines exactly what content the broadsheet renderer accepts and the only
 * theme axis Bohdi may vary per tenant. The archetype validates these at
 * Bohdi's authoring step; invalid content or an unrecognized theme key fails
 * before the page can ever render.
 *
 * Niche-neutral by design. Every label, headline, kicker, and table header is
 * a content slot — the archetype never assumes a maker is a baker, a
 * leatherworker, or anything else. The same broadsheet wears any niche by
 * the words Bohdi writes into it.
 */
import { z } from 'zod';
import { BROADSHEET_THEMES } from './themes';

/** Imagery slot: a prompt for generation, optionally a pre-resolved URL. */
const PhotoSlot = z.object({
  /** What Bohdi asks the image model for. The atmosphere filter is the archetype's job. */
  prompt: z.string().min(8),
  /** Optional pre-generated URL (used when reusing prior generations). */
  url: z.string().url().optional(),
  alt: z.string().min(4),
  /** Figure caption rendered under the photo in print-newspaper voice. */
  caption: z.string().min(4),
});

/** A schedule entry — one day's offering, whatever the maker offers. */
const ScheduleRow = z.object({
  day: z.string().min(3),
  itemName: z.string().min(2),
  notes: z.string().min(4),
  price: z.string().min(2),
  /** Free-text status — "Open", "Reserve", "Sold out", "Today", etc. */
  status: z.string().min(2),
  /** Marks the row as the active/featured day (renders in accent). */
  highlight: z.boolean().optional(),
});

/** A short news/notes item for the news column. */
const ShortStory = z.object({
  kicker: z.string().min(3),
  headline: z.string().min(4),
  body: z.string().min(20),
});

/** A classified — a sellable item in newspaper-listing form. */
const Classified = z.object({
  headline: z.string().min(2),
  body: z.string().min(20),
  price: z.string().min(2),
  /** Right-aligned tag — schedule + availability, like "Sat only · reserve". */
  tag: z.string().min(3),
});

/** An appearance — where the maker shows up in person this week. */
const Appearance = z.object({
  /** Day + date in long form, like "Thursday, April 18". */
  dayDate: z.string().min(6),
  /** Where, like "Hartland Farmers Market — village green". */
  location: z.string().min(4),
  /** When, like "3 to 6 in the afternoon". */
  time: z.string().min(3),
});

/**
 * The complete content contract for a broadsheet store. Every tenant produces
 * exactly this shape; the renderer structurally cannot consume anything else.
 */
export const BroadsheetContentSchema = z.object({
  /** The shop's actual name — used in the footer and as a copyright mark. */
  shopName: z.string().min(2),

  /** The masthead "newspaper" title Bohdi invents from the shop name. */
  mastheadTitle: z.string().min(4),

  /** Italic line under the masthead — the shop's motto. */
  motto: z.string().min(8),

  /** Place and edition info. All strings Bohdi authors. */
  edition: z.object({
    volumeLabel: z.string().min(3),
    issueLabel: z.string().min(3),
    city: z.string().min(2),
    region: z.string().min(2),
    dateLine: z.string().min(6),
    priceLine: z.string().min(2),
  }),

  /** Top navigation labels — the archetype provides four section labels plus two CTAs. */
  nav: z.object({
    sections: z.array(z.string().min(2)).length(4),
    primaryCta: z.string().min(2),
    secondaryCta: z.string().min(2),
  }),

  /** Front-page lead story — the featured item for this issue. */
  lead: z.object({
    kicker: z.string().min(3),
    headline: z.string().min(8),
    headlineEmphasis: z.string().min(2).optional(),
    subhead: z.string().min(20),
    photo: PhotoSlot,
    bodyDropCap: z.string().min(40),
    bodyContinuation: z.string().min(40),
    priceWord: z.string().min(4),
    priceFigure: z.string().min(2),
    ctaLabel: z.string().min(4),
  }),

  /** The schedule section — what the maker offers, day by day. */
  schedule: z.object({
    /** Ornament-row title, like "The Bakers' Almanac" or "Workshop Schedule". */
    title: z.string().min(4),
    intro: z.string().min(8),
    /** Column header labels — Bohdi names the "item" column for his niche. */
    headers: z.object({
      day: z.string().min(2),
      item: z.string().min(2),
      notes: z.string().min(3),
      price: z.string().min(3),
      status: z.string().min(3),
    }),
    rows: z.array(ScheduleRow).min(3).max(8),
  }),

  /** Three short news/notes items below the lead. */
  newsColumn: z.object({
    pageLabel: z.string().min(3),
    /** Section H3, like "Around the oven" or "From the bench". */
    sectionTitle: z.string().min(4),
    stories: z.array(ShortStory).length(3),
  }),

  /** Classifieds — sellable items in print-listing form. */
  classifieds: z.object({
    /** Ornament-row title, like "Classifieds — available this week". */
    title: z.string().min(4),
    items: z.array(Classified).min(4).max(8),
  }),

  /** Appearances — markets, events, popups, anywhere the maker shows up. */
  appearances: z.object({
    pageLabel: z.string().min(3),
    /** Section H3, like "From the cart" or "On the road this week". */
    sectionTitle: z.string().min(4),
    intro: z.string().min(8),
    events: z.array(Appearance).min(1).max(6),
  }),

  /** A signed letter from the founder. */
  founderNote: z.object({
    /** Ornament-row title, like "From the baker" or "From the founder". */
    title: z.string().min(4),
    paragraphs: z.array(z.string().min(40)).min(1).max(4),
    signatureName: z.string().min(2),
    signatureRole: z.string().min(4),
  }),

  /** Colophon — small print at the foot. */
  colophon: z.object({
    description: z.string().min(20),
    /** "Correspond" column label — Bohdi names it for his niche. */
    contactColumnTitle: z.string().min(4),
    contact: z.object({
      email: z.string().min(4),
      phone: z.string().min(4),
      address: z.string().min(4),
    }),
    subscribe: z.object({
      title: z.string().min(4),
      blurb: z.string().min(8),
      ctaLabel: z.string().min(4),
    }),
    printedLine: z.string().min(4),
  }),
});

export type BroadsheetContent = z.infer<typeof BroadsheetContentSchema>;

/**
 * The only theme choice Bohdi can make for this archetype is which curated
 * theme variant to wear. Everything inside the theme — colors, fonts, scale,
 * spacing, atmosphere, motion — is the archetype's, not his.
 */
export const BroadsheetThemeSchema = z.object({
  themeKey: z.enum(
    Object.keys(BROADSHEET_THEMES) as [string, ...string[]],
  ),
});

export type BroadsheetThemePick = z.infer<typeof BroadsheetThemeSchema>;
