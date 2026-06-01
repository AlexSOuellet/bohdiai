import type { CSSProperties } from 'react';
import type { Density, Intent, SpacingScale } from '@/lib/layout';
import { SURFACE_ON_COLOR, type SurfaceRole, type TypeScaleRole } from '@/lib/design-system/types';

const SPACING_ORDER: SpacingScale[] = [
  'none',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  'xxl',
];

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function paletteVar(name: string): string {
  return `var(--palette-${slugify(name)})`;
}

export function fontVar(name: string): string {
  return `var(--font-${slugify(name)})`;
}

export function textureVar(name: string): string {
  return `var(--texture-${slugify(name)})`;
}

export type IntentStyleVars = CSSProperties & {
  '--node-palette'?: string;
  '--node-font'?: string;
  '--node-texture'?: string;
};

/**
 * All typographic properties for a type-scale role, read from the design system's
 * compiled CSS variables. The renderer never hardcodes font, size, weight, line-height,
 * letter-spacing, or transform — every component that renders text reads them from here.
 */
export function typeRoleStyle(role: TypeScaleRole): CSSProperties {
  return {
    fontFamily: `var(--type-${role}-font)`,
    fontSize: `var(--type-${role}-size)`,
    fontWeight: `var(--type-${role}-weight)` as CSSProperties['fontWeight'],
    lineHeight: `var(--type-${role}-line-height)`,
    letterSpacing: `var(--type-${role}-letter-spacing, normal)`,
    textTransform: `var(--type-${role}-transform, none)` as CSSProperties['textTransform'],
  };
}

/**
 * Just the font family for a type-scale role — for places that want the tenant's
 * typeface but set their own size/weight/spacing. Moment bricks use this: the
 * brick owns the cinematic SCALE (a big clamp), the tenant owns the FONT, so the
 * brand reads as the maker's identity without inheriting the small nav wordmark size.
 */
export function typeRoleFont(role: TypeScaleRole): CSSProperties {
  return { fontFamily: `var(--type-${role}-font)` };
}

/**
 * Turns a surface role into a background + paired foreground color, both from the
 * design system's semantic color tokens. Because every M3 surface has a guaranteed
 * contrasting `on-*` color, a container that uses this can never produce unreadable
 * text, and descendants inherit the readable color. Returns {} when no surface is set.
 */
export function surfaceStyleVars(surface: SurfaceRole | undefined): CSSProperties {
  if (surface === undefined) return {};
  return {
    background: `var(--color-${surface})`,
    color: `var(--color-${SURFACE_ON_COLOR[surface]})`,
  };
}

export function intentToStyleVars(intent: Intent | undefined): IntentStyleVars {
  const style: IntentStyleVars = {};
  if (!intent) return style;
  if (intent.palette !== undefined) {
    style['--node-palette'] = paletteVar(intent.palette);
  }
  if (intent.type !== undefined) {
    style['--node-font'] = fontVar(intent.type);
    style.fontFamily = fontVar(intent.type);
  }
  if (intent.texture !== undefined) {
    style['--node-texture'] = textureVar(intent.texture);
  }
  return style;
}

export function applyDensity(
  spacing: SpacingScale | undefined,
  density: Density | undefined,
): SpacingScale | undefined {
  if (spacing === undefined) return undefined;
  if (density === undefined || density === 'normal') return spacing;
  const idx = SPACING_ORDER.indexOf(spacing);
  if (idx < 0) return spacing;
  const shift = density === 'compact' ? -1 : 1;
  const next = Math.max(0, Math.min(SPACING_ORDER.length - 1, idx + shift));
  return SPACING_ORDER[next] ?? spacing;
}

export function inheritedDensity(
  parent: Density | undefined,
  intent: Intent | undefined,
): Density | undefined {
  return intent?.density ?? parent;
}
