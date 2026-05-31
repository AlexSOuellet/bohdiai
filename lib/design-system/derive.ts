import {
  argbFromHex,
  hexFromArgb,
  Scheme,
} from '@material/material-color-utilities';
import type { SemanticColors } from './types';

export function deriveSemanticColors(
  primarySeedColor: string,
  scheme: 'light' | 'dark',
): SemanticColors {
  const seed = argbFromHex(primarySeedColor);
  const m3 = scheme === 'dark' ? Scheme.dark(seed) : Scheme.light(seed);
  return {
    surface: hexFromArgb(m3.surface),
    onSurface: hexFromArgb(m3.onSurface),
    surfaceVariant: hexFromArgb(m3.surfaceVariant),
    onSurfaceVariant: hexFromArgb(m3.onSurfaceVariant),
    primary: hexFromArgb(m3.primary),
    onPrimary: hexFromArgb(m3.onPrimary),
    primaryContainer: hexFromArgb(m3.primaryContainer),
    onPrimaryContainer: hexFromArgb(m3.onPrimaryContainer),
    secondary: hexFromArgb(m3.secondary),
    onSecondary: hexFromArgb(m3.onSecondary),
    secondaryContainer: hexFromArgb(m3.secondaryContainer),
    onSecondaryContainer: hexFromArgb(m3.onSecondaryContainer),
    outline: hexFromArgb(m3.outline),
    inverseSurface: hexFromArgb(m3.inverseSurface),
    inverseOnSurface: hexFromArgb(m3.inverseOnSurface),
  };
}
