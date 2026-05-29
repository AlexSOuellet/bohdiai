import { describe, it, expect } from 'vitest';
import { tokensToCssVars, DesignTokensSchema } from './tokens';
import type { DesignTokens } from './tokens';

const BASE_TOKENS: DesignTokens = {
  colors: {
    primary: '#2c6e49',
    accent: '#8ecae6',
    background: '#f5f0e8',
    surface: '#ffffff',
    text: '#1a1a1a',
    textMuted: '#6b6b6b',
    border: '#e0dbd2',
  },
  typography: {
    headingFont: 'Playfair Display',
    bodyFont: 'Inter',
    headingWeight: 700,
    headingLetterSpacing: '-0.02em',
    bodyLineHeight: '1.6',
    baseSize: '16px',
  },
  wordmark: {
    font: 'Bodoni Moda',
    treatment: 'solid',
    color1: '#1a1a1a',
    color2: '',
    letterSpacing: '-0.03em',
  },
  shape: {
    borderRadius: 'md',
    cardBorderRadius: 'lg',
  },
  spacing: {
    sectionPadding: 'normal',
    cardGap: 'normal',
  },
  layout: {
    heroStyle: 'full-bleed',
    productGridCols: 3,
    footerStyle: 'minimal',
  },
};

describe('DesignTokensSchema', () => {
  it('accepts valid tokens', () => {
    expect(() => DesignTokensSchema.parse(BASE_TOKENS)).not.toThrow();
  });

  it('rejects invalid borderRadius', () => {
    const bad = { ...BASE_TOKENS, shape: { ...BASE_TOKENS.shape, borderRadius: 'huge' } };
    expect(() => DesignTokensSchema.parse(bad)).toThrow();
  });

  it('rejects invalid sectionPadding', () => {
    const bad = { ...BASE_TOKENS, spacing: { ...BASE_TOKENS.spacing, sectionPadding: 'extra' } };
    expect(() => DesignTokensSchema.parse(bad)).toThrow();
  });

  it('rejects invalid productGridCols', () => {
    const bad = { ...BASE_TOKENS, layout: { ...BASE_TOKENS.layout, productGridCols: 5 } };
    expect(() => DesignTokensSchema.parse(bad)).toThrow();
  });
});

describe('tokensToCssVars', () => {
  it('outputs a :root block', () => {
    const css = tokensToCssVars(BASE_TOKENS);
    expect(css).toMatch(/^:root \{/);
    expect(css).toMatch(/\}$/);
  });

  it('includes all color vars', () => {
    const css = tokensToCssVars(BASE_TOKENS);
    expect(css).toContain('--color-primary: #2c6e49');
    expect(css).toContain('--color-accent: #8ecae6');
    expect(css).toContain('--color-background: #f5f0e8');
    expect(css).toContain('--color-surface: #ffffff');
    expect(css).toContain('--color-text: #1a1a1a');
    expect(css).toContain('--color-text-muted: #6b6b6b');
    expect(css).toContain('--color-border: #e0dbd2');
  });

  it('includes all typography vars', () => {
    const css = tokensToCssVars(BASE_TOKENS);
    expect(css).toContain('--font-heading: Playfair Display');
    expect(css).toContain('--font-body: Inter');
    expect(css).toContain('--heading-weight: 700');
    expect(css).toContain('--heading-letter-spacing: -0.02em');
    expect(css).toContain('--body-line-height: 1.6');
    expect(css).toContain('--base-size: 16px');
  });

  it('includes all wordmark vars', () => {
    const css = tokensToCssVars(BASE_TOKENS);
    expect(css).toContain('--wordmark-font: Bodoni Moda');
    expect(css).toContain('--wordmark-color-1: #1a1a1a');
    expect(css).toContain('--wordmark-color-2: ');
    expect(css).toContain('--wordmark-letter-spacing: -0.03em');
  });

  it('rejects invalid wordmark treatment', () => {
    const bad = { ...BASE_TOKENS, wordmark: { ...BASE_TOKENS.wordmark, treatment: 'rainbow' } };
    expect(() => DesignTokensSchema.parse(bad)).toThrow();
  });

  it('resolves borderRadius enum to px values', () => {
    const css = tokensToCssVars(BASE_TOKENS);
    expect(css).toContain('--border-radius: 8px');   // md
    expect(css).toContain('--card-border-radius: 16px'); // lg
  });

  it('resolves sectionPadding enum', () => {
    const normal = tokensToCssVars(BASE_TOKENS);
    expect(normal).toContain('--spacing-section: 5rem');

    const compact = tokensToCssVars({ ...BASE_TOKENS, spacing: { ...BASE_TOKENS.spacing, sectionPadding: 'compact' } });
    expect(compact).toContain('--spacing-section: 3rem');

    const spacious = tokensToCssVars({ ...BASE_TOKENS, spacing: { ...BASE_TOKENS.spacing, sectionPadding: 'spacious' } });
    expect(spacious).toContain('--spacing-section: 8rem');
  });

  it('resolves cardGap enum', () => {
    const normal = tokensToCssVars(BASE_TOKENS);
    expect(normal).toContain('--card-gap: 1.5rem');

    const tight = tokensToCssVars({ ...BASE_TOKENS, spacing: { ...BASE_TOKENS.spacing, cardGap: 'tight' } });
    expect(tight).toContain('--card-gap: 1rem');

    const loose = tokensToCssVars({ ...BASE_TOKENS, spacing: { ...BASE_TOKENS.spacing, cardGap: 'loose' } });
    expect(loose).toContain('--card-gap: 2.5rem');
  });
});
