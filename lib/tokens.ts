import { z } from 'zod';

// ─── Schema ───────────────────────────────────────────────────────────────────

export const DesignTokensSchema = z.object({
  colors: z.object({
    primary: z.string(), // main brand color (hex or hsl)
    accent: z.string(), // CTA and highlight color
    background: z.string(), // page background
    surface: z.string(), // card and panel backgrounds
    text: z.string(), // primary text
    textMuted: z.string(), // secondary text, captions, labels
    border: z.string(), // borders and dividers
  }),
  typography: z.object({
    headingFont: z.string(), // CSS font-family value (Google Font or system stack)
    bodyFont: z.string(),
    headingWeight: z.number().int(), // 400 | 600 | 700 | 800 | 900
    headingLetterSpacing: z.string(), // e.g. '-0.02em' | '0em' | '0.05em'
    bodyLineHeight: z.string(), // e.g. '1.5' | '1.6' | '1.75'
    baseSize: z.string(), // e.g. '16px' | '17px' | '18px'
  }),
  wordmark: z.object({
    font: z.string(), // display font for the wordmark — distinct from headingFont
    treatment: z.enum(['solid', 'gradient', 'outline', 'two-tone']),
    color1: z.string(), // always used (the only color for solid/outline; first word for two-tone; gradient start)
    color2: z.string(), // gradient end / second word for two-tone; empty string '' for solid/outline
    letterSpacing: z.string(), // e.g. '-0.03em' for tight display, '0.08em' for spaced caps
  }),
  shape: z.object({
    borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']),
    cardBorderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']),
  }),
  spacing: z.object({
    sectionPadding: z.enum(['compact', 'normal', 'spacious']),
    cardGap: z.enum(['tight', 'normal', 'loose']),
  }),
  layout: z.object({
    heroStyle: z.enum(['full-bleed', 'contained', 'split']),
    productGridCols: z.union([z.literal(2), z.literal(3), z.literal(4)]),
    footerStyle: z.enum(['minimal', 'standard', 'rich']),
  }),
});

export type DesignTokens = z.infer<typeof DesignTokensSchema>;

// ─── CSS variable mapping ─────────────────────────────────────────────────────

const RADIUS_VALUES: Record<'none' | 'sm' | 'md' | 'lg' | 'full', string> = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '16px',
  full: '9999px',
};

const SECTION_PADDING_VALUES: Record<'compact' | 'normal' | 'spacious', string> = {
  compact: '3rem',
  normal: '5rem',
  spacious: '8rem',
};

const CARD_GAP_VALUES: Record<'tight' | 'normal' | 'loose', string> = {
  tight: '1rem',
  normal: '1.5rem',
  loose: '2.5rem',
};

/**
 * Converts a DesignTokens object to a CSS :root block that injects all tokens
 * as CSS custom properties. Called by the storefront layout to skin a tenant's site.
 */
export function tokensToCssVars(tokens: DesignTokens): string {
  const { colors, typography, wordmark, shape, spacing } = tokens;

  const vars: string[] = [
    `--color-primary: ${colors.primary}`,
    `--color-accent: ${colors.accent}`,
    `--color-background: ${colors.background}`,
    `--color-surface: ${colors.surface}`,
    `--color-text: ${colors.text}`,
    `--color-text-muted: ${colors.textMuted}`,
    `--color-border: ${colors.border}`,

    `--font-heading: ${typography.headingFont}`,
    `--font-body: ${typography.bodyFont}`,
    `--heading-weight: ${typography.headingWeight}`,
    `--heading-letter-spacing: ${typography.headingLetterSpacing}`,
    `--body-line-height: ${typography.bodyLineHeight}`,
    `--base-size: ${typography.baseSize}`,

    `--wordmark-font: ${wordmark.font}`,
    `--wordmark-color-1: ${wordmark.color1}`,
    `--wordmark-color-2: ${wordmark.color2}`,
    `--wordmark-letter-spacing: ${wordmark.letterSpacing}`,

    `--border-radius: ${RADIUS_VALUES[shape.borderRadius]}`,
    `--card-border-radius: ${RADIUS_VALUES[shape.cardBorderRadius]}`,

    `--spacing-section: ${SECTION_PADDING_VALUES[spacing.sectionPadding]}`,
    `--card-gap: ${CARD_GAP_VALUES[spacing.cardGap]}`,
  ];

  return `:root {\n  ${vars.join(';\n  ')};\n}`;
}
