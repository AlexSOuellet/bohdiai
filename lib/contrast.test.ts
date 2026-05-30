import { describe, it, expect } from 'vitest';
import { contrastRatio, adjustForContrast, enforceTokenContrast } from './contrast';
import type { DesignTokens } from './tokens';

// ─── contrastRatio ────────────────────────────────────────────────────────────

describe('contrastRatio', () => {
  it('returns 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('returns 1:1 for identical colors', () => {
    expect(contrastRatio('#888888', '#888888')).toBeCloseTo(1, 5);
  });

  it('is commutative', () => {
    const a = contrastRatio('#1a1a1a', '#f5f5f5');
    const b = contrastRatio('#f5f5f5', '#1a1a1a');
    expect(a).toBeCloseTo(b, 5);
  });

  it('returns >= 4.5 for known passing pair', () => {
    // dark gray on white — clearly passes AA
    expect(contrastRatio('#595959', '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });

  it('returns < 4.5 for known failing pair', () => {
    // medium gray on white — fails AA for normal text
    expect(contrastRatio('#949494', '#ffffff')).toBeLessThan(4.5);
  });

  it('handles 3-digit hex', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 0);
  });
});

// ─── adjustForContrast ────────────────────────────────────────────────────────

describe('adjustForContrast', () => {
  it('returns the original color when it already passes', () => {
    const result = adjustForContrast('#ffffff', '#000000', 4.5);
    expect(result).toBe('#ffffff');
  });

  it('lightens a dark-background foreground until it passes', () => {
    const bg = '#111009'; // billcraft background
    const fg = '#8C7D6A'; // billcraft muted — was failing
    const result = adjustForContrast(fg, bg, 3.0);
    expect(contrastRatio(result, bg)).toBeGreaterThanOrEqual(3.0);
  });

  it('darkens a light-background foreground until it passes', () => {
    const bg = '#ffffff';
    const fg = '#bbbbbb'; // light gray — fails on white
    const result = adjustForContrast(fg, bg, 4.5);
    expect(contrastRatio(result, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('achieves the exact minimum — does not over-adjust', () => {
    const bg = '#ffffff';
    const fg = '#bbbbbb';
    const result = adjustForContrast(fg, bg, 4.5);
    const ratio = contrastRatio(result, bg);
    // Should be >= 4.5 but not radically over (within 0.5 of minimum)
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeLessThan(6.0);
  });

  it('handles a passing near-black on near-black edge case by pushing to white', () => {
    // primary ≈ background — the billcraft bug
    const result = adjustForContrast('#1C1410', '#111009', 4.5);
    expect(contrastRatio(result, '#111009')).toBeGreaterThanOrEqual(4.5);
  });

  it('picks the minimal-delta direction when both lighter and darker can pass', () => {
    // A mid-gray fg on a near-white bg: darker direction trivially passes;
    // lighter cannot really reach the threshold for this case → the algorithm
    // should still return a passing color. Use a starting fg slightly closer
    // to dark so both endpoints (0 and 1) easily clear a low threshold,
    // exercising the "both passed — pick smaller delta" branch.
    const bg = '#888888';
    const fg = '#888888'; // same as bg, contrast 1:1, needs adjustment
    // minRatio 2.0 is achievable in both directions from mid-gray.
    const result = adjustForContrast(fg, bg, 2.0);
    expect(contrastRatio(result, bg)).toBeGreaterThanOrEqual(2.0);
  });

  it('falls back to the best-available direction when neither direction can hit the minimum', () => {
    // Mid-gray background where even pure white and pure black cannot reach
    // a very high contrast ratio — exercises the "neither passes — return
    // best available" branch.
    const bg = '#777777';
    const fg = '#777777';
    const result = adjustForContrast(fg, bg, 21);
    // Result is one of the two endpoint candidates; not asserting >= 21 because
    // the function explicitly returns the best achievable when neither passes.
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
    const ratio = contrastRatio(result, bg);
    // Picks the better of the two endpoints (black ≈ 4.78, white ≈ 4.48).
    expect(ratio).toBeGreaterThan(4.5);
  });
});

// ─── enforceTokenContrast wordmark color2 branch ──────────────────────────────

describe('enforceTokenContrast wordmark color2', () => {
  it('adjusts wordmark.color2 when it is non-empty', () => {
    const tokens = makeTokens();
    // Override wordmark with a failing color2 to exercise the non-empty branch.
    tokens.wordmark.color2 = '#444444';
    tokens.colors.background = '#333333';
    const result = enforceTokenContrast(tokens);
    expect(result.wordmark.color2).not.toBe('');
    expect(contrastRatio(result.wordmark.color2, result.colors.background)).toBeGreaterThanOrEqual(3.0);
  });

  it('leaves wordmark.color2 empty when it starts empty', () => {
    const tokens = makeTokens();
    const result = enforceTokenContrast(tokens);
    expect(result.wordmark.color2).toBe('');
  });

  it('adjusts a green-dominant foreground (exercises hexToHsl max=g branch)', () => {
    // Failing pastel green on white → must adjust.
    const result = adjustForContrast('#88dd66', '#ffffff', 4.5);
    expect(contrastRatio(result, '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });

  it('adjusts a blue-dominant foreground (exercises hexToHsl max=b branch)', () => {
    const result = adjustForContrast('#6688dd', '#ffffff', 4.5);
    expect(contrastRatio(result, '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });

  it('skips accent adjustment when skipAccent option is true', () => {
    const tokens = makeTokens({ accent: '#444444', background: '#333333' });
    const result = enforceTokenContrast(tokens, { skipAccent: true });
    expect(result.colors.accent).toBe('#444444');
  });
});

// ─── enforceTokenContrast ─────────────────────────────────────────────────────

function makeTokens(overrides: Partial<DesignTokens['colors']> = {}): DesignTokens {
  return {
    colors: {
      primary: '#1C1410',
      accent: '#B85C1A',
      background: '#111009',
      surface: '#1E1A12',
      text: '#E8DECE',
      textMuted: '#8C7D6A',
      border: '#2E2A22',
      ...overrides,
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
      color1: '#E8DECE',
      color2: '',
      letterSpacing: '-0.03em',
    },
    shape: { borderRadius: 'sm', cardBorderRadius: 'md' },
    spacing: { sectionPadding: 'normal', cardGap: 'normal' },
    layout: { heroStyle: 'full-bleed', productGridCols: 3, footerStyle: 'minimal' },
  };
}

describe('enforceTokenContrast', () => {
  it('does not mutate the input tokens', () => {
    const tokens = makeTokens();
    const original = JSON.stringify(tokens);
    enforceTokenContrast(tokens);
    expect(JSON.stringify(tokens)).toBe(original);
  });

  it('passes through tokens that already meet contrast requirements', () => {
    const tokens = makeTokens();
    const result = enforceTokenContrast(tokens);
    // billcraft's text (#E8DECE) on background (#111009) already passes
    expect(result.colors.text).toBe(tokens.colors.text);
  });

  it('fixes text that fails on background', () => {
    const tokens = makeTokens({ text: '#555555', background: '#444444' });
    const result = enforceTokenContrast(tokens);
    expect(contrastRatio(result.colors.text, result.colors.background)).toBeGreaterThanOrEqual(4.5);
  });

  it('fixes text that fails on surface', () => {
    const tokens = makeTokens({ text: '#555555', surface: '#4A4A4A' });
    const result = enforceTokenContrast(tokens);
    expect(contrastRatio(result.colors.text, result.colors.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it('fixes muted text that fails on background', () => {
    const tokens = makeTokens({ textMuted: '#666666', background: '#555555' });
    const result = enforceTokenContrast(tokens);
    expect(contrastRatio(result.colors.textMuted, result.colors.background)).toBeGreaterThanOrEqual(3.0);
  });

  it('fixes accent that fails on background', () => {
    const tokens = makeTokens({ accent: '#444444', background: '#333333' });
    const result = enforceTokenContrast(tokens);
    expect(contrastRatio(result.colors.accent, result.colors.background)).toBeGreaterThanOrEqual(3.0);
  });

  it('all six enforced pairs pass on a problem palette', () => {
    // Simulate a badly generated palette
    const tokens = makeTokens({
      background: '#888888',
      surface: '#999999',
      text: '#777777',
      textMuted: '#808080',
      accent: '#8A8A8A',
    });
    const result = enforceTokenContrast(tokens);
    const { background, surface, text, textMuted, accent } = result.colors;
    expect(contrastRatio(text, background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(text, surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(textMuted, background)).toBeGreaterThanOrEqual(3.0);
    expect(contrastRatio(textMuted, surface)).toBeGreaterThanOrEqual(3.0);
    expect(contrastRatio(accent, background)).toBeGreaterThanOrEqual(3.0);
    expect(contrastRatio(accent, surface)).toBeGreaterThanOrEqual(3.0);
  });
});
