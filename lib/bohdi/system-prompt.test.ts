import { describe, it, expect } from 'vitest';
import { systemPromptFor, BOHDI_SYSTEM_PROMPT } from './system-prompt';

describe('systemPromptFor', () => {
  it('returns the intro-moment prompt for candles', () => {
    const p = systemPromptFor('candles');
    // still authors the full design system
    expect(p).toContain('THE DESIGN SYSTEM');
    expect(p).toContain('set_style_sheet');
    // generates the moment asset
    expect(p).toContain('generate_moment_asset');
    // teaches the three bricks
    expect(p).toContain('story over video');
    expect(p).toContain('story over still');
    expect(p).toContain('spotlight');
    // scoped to the intro only — not a full multi-page site
    expect(p).toMatch(/only the intro|just the intro/i);
    // craft floor
    expect(p).toMatch(/atmosphere/i);
  });

  it('returns the legacy prompt for non-layout niches', () => {
    const p = systemPromptFor('leatherworker');
    expect(p).toContain('PRODUCTION ORDER');
    expect(p).toContain('set_tokens');
    expect(p).not.toContain('THE STYLE SHEET');
  });

  it('returns the legacy prompt for unknown niches', () => {
    expect(systemPromptFor('mystery-niche')).toBe(systemPromptFor('leatherworker'));
  });

  it('exports BOHDI_SYSTEM_PROMPT (the legacy default)', () => {
    expect(BOHDI_SYSTEM_PROMPT).toBe(systemPromptFor('leatherworker'));
  });
});
