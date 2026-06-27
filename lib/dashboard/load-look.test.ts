import { describe, it, expect, vi, beforeEach } from 'vitest';

let pageData: { layout_tree: unknown } | null = null;
let feeling: string | null = 'cozy';

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: () => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () => ({ data: pageData }),
      };
      return chain;
    },
  }),
}));
vi.mock('@/lib/editor/look-shelf', () => ({
  feelingForSkin: () => feeling,
}));

import { loadCurrentLook } from './load-look';

function tree(root: unknown) {
  return { layout_tree: { root } };
}

beforeEach(() => {
  pageData = null;
  feeling = 'cozy';
});

describe('loadCurrentLook', () => {
  it('reads the look key and a valid stored mood off the archetype root', async () => {
    pageData = tree({ kind: 'archetype', lookKey: 'main-street-ember', mood: 'rustic' });
    expect(await loadCurrentLook('t1')).toEqual({ lookKey: 'main-street-ember', moodKey: 'rustic' });
  });

  it('derives the feeling from the skin when the stored mood is not a real mood key', async () => {
    feeling = 'modern';
    pageData = tree({ kind: 'archetype', lookKey: 'main-street-anvil', mood: 'not-a-mood' });
    expect(await loadCurrentLook('t1')).toEqual({ lookKey: 'main-street-anvil', moodKey: 'modern' });
  });

  it('falls back to rustic when the mood is invalid and the skin maps to no feeling', async () => {
    feeling = null;
    pageData = tree({ kind: 'archetype', lookKey: 'orphan-skin', mood: 'not-a-mood' });
    expect(await loadCurrentLook('t1')).toEqual({ lookKey: 'orphan-skin', moodKey: 'rustic' });
  });

  it('returns null when there is no published home page', async () => {
    pageData = null;
    expect(await loadCurrentLook('t1')).toBeNull();
  });

  it('returns null when the layout tree is not an object', async () => {
    pageData = { layout_tree: 'legacy-string' };
    expect(await loadCurrentLook('t1')).toBeNull();
  });

  it('returns null when the layout tree is an array', async () => {
    pageData = { layout_tree: [] };
    expect(await loadCurrentLook('t1')).toBeNull();
  });

  it('returns null when the root is missing or not an object', async () => {
    pageData = tree(null);
    expect(await loadCurrentLook('t1')).toBeNull();
  });

  it('returns null for a legacy (non-archetype) root', async () => {
    pageData = tree({ kind: 'legacy', lookKey: 'x' });
    expect(await loadCurrentLook('t1')).toBeNull();
  });

  it('returns null when the look key is not a string', async () => {
    pageData = tree({ kind: 'archetype', lookKey: 42, mood: 'cozy' });
    expect(await loadCurrentLook('t1')).toBeNull();
  });
});
