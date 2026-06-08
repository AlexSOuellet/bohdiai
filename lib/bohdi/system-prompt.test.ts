import { describe, it, expect } from 'vitest';
import { systemPromptFor, BOHDI_SYSTEM_PROMPT } from './system-prompt';

describe('systemPromptFor', () => {
  it('returns the legacy prompt for every niche, including the old layout niche', () => {
    // The layout-engine path was deleted — candles now gets the legacy prompt
    // like every other niche, with no leftover INTRO_MOMENT bias.
    const candles = systemPromptFor('candles');
    expect(candles).toBe(systemPromptFor('leatherworker'));
    expect(candles).not.toContain('generate_moment_asset');
    expect(candles).not.toContain('story over video');
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
