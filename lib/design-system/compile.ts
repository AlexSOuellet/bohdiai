import { TYPE_SCALE_ROLES } from './types';
import type { SemanticColors } from './types';
import type { StyleSheet } from '@/lib/style-sheet';
import { slugifyEntry } from '@/lib/style-sheet';

const SEMANTIC_COLOR_VARS: [keyof SemanticColors, string][] = [
  ['surface', 'surface'],
  ['onSurface', 'on-surface'],
  ['surfaceVariant', 'surface-variant'],
  ['onSurfaceVariant', 'on-surface-variant'],
  ['primary', 'primary'],
  ['onPrimary', 'on-primary'],
  ['primaryContainer', 'primary-container'],
  ['onPrimaryContainer', 'on-primary-container'],
  ['secondary', 'secondary'],
  ['onSecondary', 'on-secondary'],
  ['secondaryContainer', 'secondary-container'],
  ['onSecondaryContainer', 'on-secondary-container'],
  ['outline', 'outline'],
  ['inverseSurface', 'inverse-surface'],
  ['inverseOnSurface', 'inverse-on-surface'],
];

/**
 * Emits CSS variables for semantic colors, type scale (mobile-first with md override),
 * and spacing. Returns lines to merge into :root {} and an @media block for desktop.
 */
export function compileDesignSystemVars(
  sheet: StyleSheet,
  semanticColors: SemanticColors,
): { rootLines: string[]; mediaLines: string[] } {
  const rootLines: string[] = [];
  const mediaLines: string[] = [];

  // Semantic colors
  for (const [key, cssName] of SEMANTIC_COLOR_VARS) {
    rootLines.push(`  --color-${cssName}: ${semanticColors[key]};`);
  }

  // Type scale — mobile-first (rootLines), desktop override (mediaLines)
  const fontMap = new Map(sheet.fonts.map((f) => [f.name, f]));
  for (const role of TYPE_SCALE_ROLES) {
    const entry = sheet.typeScale[role];
    const font = fontMap.get(entry.fontName);
    if (font) {
      const quotedFamily = /\s/.test(font.family) ? `"${font.family}"` : font.family;
      rootLines.push(`  --type-${role}-font: ${quotedFamily}, ${font.fallback};`);
    }
    // Mobile size is the default (mobile-first)
    rootLines.push(`  --type-${role}-size: ${entry.sizeMobilePx}px;`);
    rootLines.push(`  --type-${role}-weight: ${entry.weight};`);
    rootLines.push(`  --type-${role}-line-height: ${entry.lineHeight};`);
    if (entry.letterSpacing !== undefined) {
      rootLines.push(`  --type-${role}-letter-spacing: ${entry.letterSpacing};`);
    }
    if (entry.uppercase === true) {
      rootLines.push(`  --type-${role}-transform: uppercase;`);
    }
    // Desktop override
    if (entry.sizePx !== entry.sizeMobilePx) {
      mediaLines.push(`  --type-${role}-size: ${entry.sizePx}px;`);
    }
  }

  // Spacing
  rootLines.push(`  --spacing-unit: ${sheet.spacing.unit}px;`);

  return { rootLines, mediaLines };
}

/**
 * Builds the full compiled CSS string for the design system portion of a style sheet.
 * Caller merges this with the existing palette/font/texture variables.
 */
export function buildDesignSystemCss(
  sheet: StyleSheet,
  semanticColors: SemanticColors,
): string {
  const { rootLines, mediaLines } = compileDesignSystemVars(sheet, semanticColors);
  const blocks: string[] = [':root {\n' + rootLines.join('\n') + '\n}'];
  if (mediaLines.length > 0) {
    blocks.push(
      '@media (min-width: 768px) {\n  :root {\n' +
        mediaLines.map((l) => '  ' + l).join('\n') +
        '\n  }\n}',
    );
  }
  return blocks.join('\n');
}

export { slugifyEntry };
