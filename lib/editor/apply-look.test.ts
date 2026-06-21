import { describe, it, expect } from 'vitest';
import { applyLookToEnvelope } from './apply-look';

function envelope() {
  return {
    root: {
      kind: 'archetype',
      archetypeKey: 'main-street',
      lookKey: 'main-street-ember',
      accentOverride: '#123456',
      mood: 'rustic',
      catalogSize: 12,
      content: { hero: { brand: 'Karen’s Knits' } },
    },
    meta: { title: 'Karen’s Knits' },
  };
}

describe('applyLookToEnvelope', () => {
  it('swaps the look and feeling and stashes the prior pair', () => {
    const { next, prior } = applyLookToEnvelope(envelope(), {
      skinKey: 'main-street-nightshade',
      moodKey: 'dark',
    });
    const root = next['root'] as Record<string, unknown>;
    expect(root['lookKey']).toBe('main-street-nightshade');
    expect(root['mood']).toBe('dark');
    expect(root['previousLook']).toEqual({ lookKey: 'main-street-ember', mood: 'rustic' });
    expect(prior).toEqual({ lookKey: 'main-street-ember', mood: 'rustic' });
  });

  it('preserves authored content, accent override, catalog size, and meta', () => {
    const { next } = applyLookToEnvelope(envelope(), {
      skinKey: 'main-street-studio',
      moodKey: 'modern',
    });
    const root = next['root'] as Record<string, unknown>;
    expect(root['accentOverride']).toBe('#123456');
    expect(root['catalogSize']).toBe(12);
    expect(root['content']).toEqual({ hero: { brand: 'Karen’s Knits' } });
    expect(next['meta']).toEqual({ title: 'Karen’s Knits' });
  });

  it('does not mutate the input tree', () => {
    const input = envelope();
    applyLookToEnvelope(input, { skinKey: 'main-street-studio', moodKey: 'modern' });
    expect(input.root.lookKey).toBe('main-street-ember');
    expect('previousLook' in input.root).toBe(false);
  });

  it('rejects an unknown skin', () => {
    expect(() =>
      applyLookToEnvelope(envelope(), { skinKey: 'main-street-nope', moodKey: 'dark' }),
    ).toThrow(/unknown skin/i);
  });

  it('rejects a non-archetype / legacy layout tree', () => {
    expect(() =>
      applyLookToEnvelope({ root: { kind: 'layout' } }, { skinKey: 'main-street-ember', moodKey: 'rustic' }),
    ).toThrow(/not an archetype/i);
    expect(() =>
      applyLookToEnvelope(null, { skinKey: 'main-street-ember', moodKey: 'rustic' }),
    ).toThrow(/not an archetype/i);
  });
});
