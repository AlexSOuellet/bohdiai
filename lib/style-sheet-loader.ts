import type { StyleSheet } from './style-sheet';
import { slugifyEntry } from './style-sheet';
import { deriveSemanticColors } from './design-system/derive';
import { compileDesignSystemVars } from './design-system/compile';

export interface CompiledStyleSheet {
  cssVariables: string;
  googleFontLinks: string[];
  customFontFaces: string;
}

function escapeForUrl(family: string): string {
  return encodeURIComponent(family.trim());
}

// Google variable fonts with an optical-size (opsz) axis. Without requesting this
// axis, Google serves the font's default (text) optical cut, so the same family at
// a large display size renders flat and generic instead of its dramatic display
// cut. The value is the font's actual opsz range. Only families verified here get
// opsz requested — a wrong range fails the whole request, so the registry stays
// conservative and grows as ranges are confirmed against Google Fonts.
const OPTICAL_SIZE_FONTS: Record<string, string> = {
  Fraunces: '9..144',
};

function googleFontHref(family: string, weights: number[], styles: string[]): string {
  const familyParam = escapeForUrl(family);
  const hasItalic = styles.includes('italic');
  const opsz = OPTICAL_SIZE_FONTS[family.trim()];
  // Axes must be listed alphabetically: ital, opsz, wght.
  const axes = [hasItalic ? 'ital' : null, opsz ? 'opsz' : null, 'wght']
    .filter((a): a is string => a !== null)
    .join(',');
  const weightDescriptors = weights
    .slice()
    .sort((a, b) => a - b)
    .flatMap((w) => {
      const italicVariants = hasItalic ? ['0', '1'] : [null];
      return italicVariants.map((ital) =>
        [ital, opsz, String(w)].filter((v): v is string => v !== null && v !== undefined).join(','),
      );
    })
    .join(';');
  return `https://fonts.googleapis.com/css2?family=${familyParam}:${axes}@${weightDescriptors}&display=swap`;
}

function paletteVariableLine(name: string, value: string): string {
  return `  --palette-${slugifyEntry(name)}: ${value};`;
}

function fontVariableLine(name: string, family: string, fallback: string): string {
  const quotedFamily = /\s/.test(family) ? `"${family}"` : family;
  return `  --font-${slugifyEntry(name)}: ${quotedFamily}, ${fallback};`;
}

function textureVariableLine(name: string, value: string): string {
  return `  --texture-${slugifyEntry(name)}: ${value};`;
}

export function compileStyleSheet(sheet: StyleSheet): CompiledStyleSheet {
  const paletteLines = sheet.palette.map((p) => paletteVariableLine(p.name, p.value));
  const fontLines = sheet.fonts.map((f) => fontVariableLine(f.name, f.family, f.fallback));
  const textureLines = sheet.textures.map((t) => textureVariableLine(t.name, t.value));

  // Derive semantic colors from M3 seed and compile design system vars
  const semanticColors = deriveSemanticColors(
    sheet.semanticColors.primarySeedColor,
    sheet.semanticColors.scheme,
  );
  const { rootLines: dsRootLines, mediaLines: dsMediaLines } = compileDesignSystemVars(
    sheet,
    semanticColors,
  );

  // Merge palette/font/texture lines with design system lines into one :root block
  const allRootLines = [...paletteLines, ...fontLines, ...textureLines, ...dsRootLines];
  let cssVariables = [':root {', ...allRootLines, '}'].join('\n');

  if (dsMediaLines.length > 0) {
    cssVariables +=
      '\n@media (min-width: 768px) {\n  :root {\n' +
      dsMediaLines.map((l) => '  ' + l).join('\n') +
      '\n  }\n}';
  }

  const googleFonts = sheet.fonts.filter((f) => f.source === 'google');
  const googleFontLinks = googleFonts.map((f) =>
    googleFontHref(f.family, f.weights, f.styles ?? ['normal']),
  );

  const customFonts = sheet.fonts.filter(
    (f): f is typeof f & { customUrl: string } =>
      f.source === 'custom' && f.customUrl !== undefined,
  );
  const customFontFaces = customFonts
    .map((f) => {
      const quotedFamily = /\s/.test(f.family) ? `"${f.family}"` : f.family;
      return [
        '@font-face {',
        `  font-family: ${quotedFamily};`,
        `  src: url(${f.customUrl}) format("woff2");`,
        '  font-display: swap;',
        '}',
      ].join('\n');
    })
    .join('\n');

  return { cssVariables, googleFontLinks, customFontFaces };
}

export function googleFontPreconnectLinks(): { rel: string; href: string; crossOrigin?: string }[] {
  return [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  ];
}
