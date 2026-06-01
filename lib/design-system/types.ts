export type ColorScheme = 'light' | 'dark';

export interface SemanticColors {
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  outline: string;
  inverseSurface: string;
  inverseOnSurface: string;
}

export const TYPE_SCALE_ROLES = [
  'eyebrow',
  'headline',
  'sub',
  'body',
  'caption',
  'wordmark',
] as const;
export type TypeScaleRole = (typeof TYPE_SCALE_ROLES)[number];

/**
 * Surface roles a container (band, pane, etc.) can paint. Each is an M3 background
 * token that has a guaranteed-readable paired foreground — so a node that declares a
 * surface emits both its background and the matching text color, and everything inside
 * inherits readable text by construction. This is how contrast is guaranteed.
 */
export const SURFACE_ROLES = [
  'surface',
  'surface-variant',
  'primary',
  'primary-container',
  'secondary',
  'secondary-container',
  'inverse-surface',
] as const;
export type SurfaceRole = (typeof SURFACE_ROLES)[number];

/** Maps each surface role to the CSS-var name of its paired foreground color. */
export const SURFACE_ON_COLOR: Record<SurfaceRole, string> = {
  surface: 'on-surface',
  'surface-variant': 'on-surface-variant',
  primary: 'on-primary',
  'primary-container': 'on-primary-container',
  secondary: 'on-secondary',
  'secondary-container': 'on-secondary-container',
  'inverse-surface': 'inverse-on-surface',
};

export interface SpacingSystem {
  unit: number;
}

export interface DerivedDesignSystem {
  semanticColors: SemanticColors;
  spacing: SpacingSystem;
}
