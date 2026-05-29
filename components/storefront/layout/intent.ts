import type { CSSProperties } from 'react';
import type { Density, Intent, SpacingScale } from '@/lib/layout';

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
