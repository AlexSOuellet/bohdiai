import type { StyleSheet } from './style-sheet';
import { slugifyEntry } from './style-sheet';

export interface CompiledStyleSheet {
  cssVariables: string;
  googleFontLinks: string[];
  customFontFaces: string;
}

function escapeForUrl(family: string): string {
  return encodeURIComponent(family.trim());
}

function googleFontHref(family: string, weights: number[], styles: string[]): string {
  const familyParam = escapeForUrl(family);
  const hasItalic = styles.includes('italic');
  const axes = hasItalic ? 'ital,wght' : 'wght';
  const weightDescriptors = weights
    .slice()
    .sort((a, b) => a - b)
    .flatMap((w) =>
      hasItalic
        ? [
            `0,${w}`,
            ...(styles.includes('italic') ? [`1,${w}`] : []),
          ]
        : [`${w}`],
    )
    .join(';');
  return `https://fonts.googleapis.com/css2?family=${familyParam}:${axes}@${weightDescriptors}&display=swap`;
}

function paletteVariableLine(name: string, value: string): string {
  return `  --palette-${slugifyEntry(name)}: ${value};`;
}

function fontVariableLine(
  name: string,
  family: string,
  fallback: string,
): string {
  const quotedFamily = /\s/.test(family) ? `"${family}"` : family;
  return `  --font-${slugifyEntry(name)}: ${quotedFamily}, ${fallback};`;
}

function textureVariableLine(name: string, value: string): string {
  return `  --texture-${slugifyEntry(name)}: ${value};`;
}

export function compileStyleSheet(sheet: StyleSheet): CompiledStyleSheet {
  const paletteLines = sheet.palette.map((p) =>
    paletteVariableLine(p.name, p.value),
  );
  const fontLines = sheet.fonts.map((f) =>
    fontVariableLine(f.name, f.family, f.fallback),
  );
  const textureLines = sheet.textures.map((t) =>
    textureVariableLine(t.name, t.value),
  );

  const cssVariables = [
    ':root {',
    ...paletteLines,
    ...fontLines,
    ...textureLines,
    '}',
  ].join('\n');

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
