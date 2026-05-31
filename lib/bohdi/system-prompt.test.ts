import { describe, it, expect } from 'vitest';
import { systemPromptFor, BOHDI_SYSTEM_PROMPT } from './system-prompt';

describe('systemPromptFor', () => {
  it('returns the layout-engine prompt for candles', () => {
    const p = systemPromptFor('candles');
    expect(p).toContain('THE DESIGN SYSTEM');
    expect(p).toContain('LAYOUT PRIMITIVES');
    expect(p).toContain('set_style_sheet');
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
