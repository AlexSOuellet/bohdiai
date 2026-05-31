import { describe, it, expect, vi, beforeEach } from 'vitest';

// Controllable Supabase response.
let singleResponse: { data: { body_markdown: string | null } | null } = {
  data: { body_markdown: '' },
};

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => singleResponse,
        }),
      }),
    }),
  }),
}));

const SAMPLE_NICHE_BODY = `# Heading should be skipped
---
title: frontmatter delimiter line
---
\`\`\`code fence skipped\`\`\`
| table | row | skipped |

- This is a bullet that becomes a tip when it is long enough to count.
* This is another bullet item explaining a technique used by candlemakers everywhere.
1. Numbered list items should also have their leading marker stripped from the front.

Regular paragraph one. This is a second sentence that explains why something matters. Short.

Skip Short Words.

A line ending in a question mark? Yes it should still count when long enough to qualify too.

Way Too Short

This sentence is duplicated for the dedupe check to take effect on output ordering.
This sentence is duplicated for the dedupe check to take effect on output ordering.

${'x'.repeat(300)}
`;

beforeEach(() => {
  singleResponse = { data: { body_markdown: SAMPLE_NICHE_BODY } };
});

describe('loadTickerContent', () => {
  it('extracts niche tips, dedupes, and returns encouragement messages', async () => {
    const { loadTickerContent } = await import('./ticker-content');
    const result = await loadTickerContent('candles', 'Sarah');

    // Tips: some real ones extracted; duplicates removed.
    expect(result.nicheTips.length).toBeGreaterThan(0);
    expect(new Set(result.nicheTips).size).toBe(result.nicheTips.length);

    // No heading, no code fence, no table row, no frontmatter delimiter line.
    for (const tip of result.nicheTips) {
      expect(tip).not.toMatch(/^#/);
      expect(tip).not.toMatch(/^---/);
      expect(tip).not.toMatch(/^```/);
      expect(tip).not.toMatch(/^\|/);
    }
    // No leading bullet markers left.
    for (const tip of result.nicheTips) {
      expect(tip).not.toMatch(/^[-*]\s/);
      expect(tip).not.toMatch(/^\d+\.\s/);
    }
    // Length-bounded.
    for (const tip of result.nicheTips) {
      expect(tip.length).toBeGreaterThanOrEqual(40);
      expect(tip.length).toBeLessThanOrEqual(240);
    }

    // Encouragement is personalized when a name is given.
    expect(result.encouragement.some((l) => l.startsWith('Sarah, '))).toBe(true);
    // Always returns the standard catalog of 7 lines.
    expect(result.encouragement.length).toBe(7);
  });

  it('caps niche tips at 30 entries', async () => {
    const manyLines = Array.from(
      { length: 80 },
      (_, i) =>
        `Tip number ${i} is a fully written-out sentence that easily exceeds the forty-character minimum for ticker display.`,
    ).join('\n');
    singleResponse = { data: { body_markdown: manyLines } };
    const { loadTickerContent } = await import('./ticker-content');
    const result = await loadTickerContent('candles');
    expect(result.nicheTips.length).toBe(30);
  });

  it('returns empty tips when the niche row is missing', async () => {
    singleResponse = { data: null };
    const { loadTickerContent } = await import('./ticker-content');
    const result = await loadTickerContent('does-not-exist');
    expect(result.nicheTips).toEqual([]);
    expect(result.encouragement.length).toBe(7);
  });

  it('returns empty tips when body_markdown is null', async () => {
    singleResponse = { data: { body_markdown: null } };
    const { loadTickerContent } = await import('./ticker-content');
    const result = await loadTickerContent('empty');
    expect(result.nicheTips).toEqual([]);
  });

  it('drops name personalization when makerName is missing or blank', async () => {
    const { loadTickerContent } = await import('./ticker-content');
    const noName = await loadTickerContent('candles');
    // No "Name, " prefix in any line.
    for (const line of noName.encouragement) {
      expect(line.startsWith(', ')).toBe(false);
    }
    const blank = await loadTickerContent('candles', '   ');
    for (const line of blank.encouragement) {
      expect(line.startsWith(', ')).toBe(false);
    }
  });

  it('skips lines that become empty after stripping bullet markers', async () => {
    // A bullet with only the marker — strip → empty → skipped (line 34 branch).
    const body = `- \n* \n1. \nA real long sentence here that should pass the forty character minimum filter.`;
    singleResponse = { data: { body_markdown: body } };
    const { loadTickerContent } = await import('./ticker-content');
    const result = await loadTickerContent('candles');
    expect(result.nicheTips.some((t) => t.includes('real long sentence'))).toBe(true);
  });

  it('skips sentences shaped like two-word internal heading labels', async () => {
    // Build a two-capitalized-word "label" sentence that hits the 40-240 char
    // window — uses long words so the regex still matches the whole thing.
    const labelSentence = 'Aaaaaaaaaaaaaaaaaaaaa Bbbbbbbbbbbbbbbbbbbbbb:';
    expect(/^[A-Z][a-z]+ [A-Z][a-z]+:?\s*$/.test(labelSentence)).toBe(true);
    expect(labelSentence.length).toBeGreaterThanOrEqual(40);
    const body = `${labelSentence}\nReal sentence that is plenty long enough to qualify and should appear in tips list.`;
    singleResponse = { data: { body_markdown: body } };
    const { loadTickerContent } = await import('./ticker-content');
    const result = await loadTickerContent('candles');
    expect(result.nicheTips.includes(labelSentence)).toBe(false);
    expect(result.nicheTips.some((t) => t.includes('Real sentence'))).toBe(true);
  });
});
