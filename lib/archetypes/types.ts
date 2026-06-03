/**
 * Archetype contract.
 *
 * An archetype is a finished page design that a tenant's content flows into.
 * It owns the eight parts a designer's artifact owns: composition, typography,
 * color, spacing/rhythm, atmosphere, motion, content slots, theme hooks.
 *
 * Composition, typography, color (as pairs), spacing, atmosphere, and motion
 * are baked into the archetype's renderer — Bohdi cannot author them and
 * cannot break them. Content slots define what Bohdi MUST fill in for any
 * tenant. Theme hooks define the only axes Bohdi may vary per tenant, each
 * a pick from a curated set the archetype knows how to wear.
 */
import type { ComponentType } from 'react';
import type { ZodTypeAny, z } from 'zod';

/** A color pair guaranteed to meet AA contrast at body size. */
export interface ColorPair {
  bg: string;
  fg: string;
  fgMuted: string;
  accent: string;
  rule: string;
  /**
   * The skin's SECOND surface — the contrast panel used by alternating bands
   * (e.g. the founder band). Direction-agnostic: a light skin's contrast is
   * near-black, a dark skin's is a lifted charcoal. Each carries its own
   * readable text. Skins that use only one surface omit it.
   */
  contrast?: { bg: string; fg: string; fgMuted: string };
}

/** Type role definitions. The archetype owns the scale and hierarchy. */
export interface TypeRole {
  family: string;
  /** desktop size in px */
  size: number;
  /** mobile size in px (defaults to size if absent) */
  sizeMobile?: number;
  weight: number;
  lineHeight: number;
  letterSpacing?: string;
  italic?: boolean;
  uppercase?: boolean;
  variationSettings?: string;
}

/** Spacing scale in pixels, semantic names. */
export interface SpacingScale {
  hairline: number;
  tight: number;
  base: number;
  loose: number;
  section: number;
  page: number;
}

/** Atmospheric layer (grain, gradients, overlays, ornaments). */
export interface Atmosphere {
  /** Inline CSS for ::before pseudo-element on the root container, if any. */
  grain?: string;
  /** Inline CSS for ::after pseudo-element on the root container, if any. */
  wash?: string;
  /** Filter applied to <img> with the .archetype-photo class. */
  photoFilter?: string;
}

/** Motion config — a single orchestrated page-load reveal. */
export interface Motion {
  reveal: {
    duration: number;
    /** ms between siblings */
    stagger: number;
    easing: string;
  };
}

/** A complete theme variant — what wearing the archetype looks like. */
export interface ArchetypeTheme {
  key: string;
  label: string;
  palette: ColorPair;
  type: Record<string, TypeRole>;
  spacing: SpacingScale;
  atmosphere: Atmosphere;
  motion: Motion;
}

/** Metadata about an archetype — used by the engine to pick one. */
export interface ArchetypeMeta {
  key: string;
  label: string;
  description: string;
  /** What kinds of niches/moods this archetype fits. */
  suitableFor: {
    nicheKinds: string[];
    moods: string[];
  };
}

/** One curated, complete page composition the archetype can wear. */
export interface ArchetypeArrangement {
  key: string;
  label: string;
}

/**
 * The archetype itself.
 *
 * Generic over content schema (TContentSchema) and theme schema (TThemeSchema).
 * The renderer receives validated content + a resolved theme object and
 * produces JSX. It is structurally invariant — Bohdi cannot change composition
 * by changing content.
 */
export interface Archetype<
  TContentSchema extends ZodTypeAny,
  TThemeSchema extends ZodTypeAny,
> {
  meta: ArchetypeMeta;

  /** Zod schema Bohdi's content must satisfy. */
  contentSchema: TContentSchema;

  /** Zod schema Bohdi's theme pick must satisfy. */
  themeSchema: TThemeSchema;

  /** Curated theme variants. Resolved from the theme pick. */
  themes: Record<string, ArchetypeTheme>;

  /**
   * Optional curated arrangements — complete page compositions the archetype
   * ships. The engine (or the maker, in the editor) picks one; the renderer
   * switches composition on it. Omitted by archetypes with a single layout.
   */
  arrangements?: Record<string, ArchetypeArrangement>;

  /** Default arrangement key when none is supplied. */
  defaultArrangement?: string;

  /** Resolve a theme pick to its concrete ArchetypeTheme. */
  resolveTheme(pick: z.infer<TThemeSchema>): ArchetypeTheme;

  /** Renderer — takes validated content + a resolved theme + optional arrangement. */
  render: ComponentType<{
    content: z.infer<TContentSchema>;
    theme: ArchetypeTheme;
    arrangement?: string;
  }>;
}
