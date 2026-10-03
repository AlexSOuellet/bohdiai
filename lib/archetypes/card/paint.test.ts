import { describe, it, expect } from 'vitest';
import { cardPaint, cardSkinKey } from './paint';
import { FAMILIES } from '@/lib/archetypes/main-street/families';

describe('cardPaint', () => {
  it('paints in the stored skin when it belongs to the family', () => {
    const paint = cardPaint({ mood: 'rustic', lookKey: 'main-street-sawdust', brandPalette: undefined });
    expect(paint.family.key).toBe('rustic');
    expect(paint.skinKey).toBe('main-street-sawdust');
    expect(paint.palette.bg).toBe('#E7DAC4');
  });

  it('falls back to the family’s own skin when the stored one isn’t the family’s', () => {
    expect(cardSkinKey(FAMILIES.rustic, 'main-street-forge')).toBe(FAMILIES.rustic.defaultSkin);
    expect(cardSkinKey(FAMILIES.rustic, 'no-such-skin')).toBe(FAMILIES.rustic.defaultSkin);
    expect(cardSkinKey(FAMILIES.luxury, 'main-street-porcelain')).toBe('main-street-porcelain');
  });

  it('every family can paint a card from its default skin', () => {
    for (const family of Object.values(FAMILIES)) {
      const paint = cardPaint({ mood: family.key, lookKey: undefined, brandPalette: undefined });
      expect(paint.family.key).toBe(family.key);
      expect(paint.palette.onAccent).toBeTruthy();
      expect(paint.palette.contrast.bg).toBeTruthy();
    }
  });

  it('uses the shop’s own brand palette, still in the family’s type', () => {
    const paint = cardPaint({ mood: 'rustic', lookKey: 'main-street-sawdust', brandPalette: { base: '#f4efe6', accent: '#2f6b3a' } });
    expect(paint.family.key).toBe('rustic');
    expect(paint.palette.bg.toLowerCase()).toBe('#f4efe6');
  });
});
