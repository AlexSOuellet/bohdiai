import { describe, it, expect } from 'vitest';
import { labelFor, stepForTool, type ProgressStep } from './progress';

const ALL_STEPS: ProgressStep[] = [
  'starting',
  'reading-niche',
  'reading-mood',
  'studying-blocks',
  'deliberating',
  'choosing-palette',
  'choosing-type',
  'composing-home',
  'writing-about',
  'writing-shop-contact',
  'briefing-hero',
  'briefing-about-photo',
  'briefing-products',
  'generating-hero-image',
  'generating-about-image',
  'generating-product-image',
  'finalizing',
];

describe('labelFor', () => {
  it('returns a non-empty label for every step (no name)', () => {
    for (const step of ALL_STEPS) {
      const out = labelFor(step);
      expect(out.length).toBeGreaterThan(0);
      expect(out).not.toContain('undefined');
      // No name passed → no opener prefix.
      expect(out.startsWith(',')).toBe(false);
    }
  });

  it('prepends the maker name when supplied', () => {
    for (const step of ALL_STEPS) {
      expect(labelFor(step, 'Sarah')).toMatch(/^Sarah, /);
    }
  });

  it('treats whitespace-only name as no name', () => {
    expect(labelFor('starting', '   ')).toBe('getting set up…');
  });

  it('treats empty name as no name', () => {
    expect(labelFor('starting', '')).toBe('getting set up…');
  });

  it('produces stable text for a known step', () => {
    expect(labelFor('choosing-palette')).toBe('choosing your colors…');
    expect(labelFor('choosing-palette', 'Alex')).toBe('Alex, choosing your colors…');
  });
});

describe('stepForTool', () => {
  it.each([
    ['read_niche', 'reading-niche'],
    ['read_mood', 'reading-mood'],
    ['list_blocks', 'studying-blocks'],
    ['list_widgets', 'studying-blocks'],
    ['log_decision', 'deliberating'],
    ['set_tokens', 'choosing-palette'],
    ['set_home_page', 'composing-home'],
    ['set_about_page', 'writing-about'],
    ['set_secondary_pages_copy', 'writing-shop-contact'],
    ['finalize', 'finalizing'],
  ])('maps %s -> %s', (tool, expected) => {
    expect(stepForTool(tool)).toBe(expected);
  });

  it('returns null for unknown tool names', () => {
    expect(stepForTool('unknown_tool')).toBe(null);
    expect(stepForTool('')).toBe(null);
  });
});
