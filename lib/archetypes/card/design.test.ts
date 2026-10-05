import { describe, it, expect } from 'vitest';
import { CardContentSchema, cardDesign } from './design';

describe('card design', () => {
  it('keeps the pinned prints when the site names no design', () => {
    expect(cardDesign(CardContentSchema.parse({}))).toBe('pinned');
  });

  it('uses the design the site names', () => {
    expect(cardDesign(CardContentSchema.parse({ design: 'bulletin' }))).toBe('bulletin');
    expect(cardDesign(CardContentSchema.parse({ design: 'pinned' }))).toBe('pinned');
    expect(cardDesign(CardContentSchema.parse({ design: 'showreel' }))).toBe('showreel');
    expect(cardDesign(CardContentSchema.parse({ design: 'torch' }))).toBe('torch');
  });

  it('refuses a design that does not exist, and anything else in the content', () => {
    expect(CardContentSchema.safeParse({ design: 'neon' }).success).toBe(false);
    expect(CardContentSchema.safeParse({ headline: 'x' }).success).toBe(false);
  });
});
