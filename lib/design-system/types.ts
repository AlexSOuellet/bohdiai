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

export const TYPE_SCALE_ROLES = ['eyebrow', 'headline', 'sub', 'body', 'caption'] as const;
export type TypeScaleRole = (typeof TYPE_SCALE_ROLES)[number];

export interface SpacingSystem {
  unit: number;
}

export interface DerivedDesignSystem {
  semanticColors: SemanticColors;
  spacing: SpacingSystem;
}
