import { describe, it, expect } from 'vitest';
import { isFamilySite, showsScrollingLine } from './site-kind';

const db = (result: { data: unknown; error: unknown }) => {
  const chain: Record<string, unknown> = {};
  for (const k of ['select', 'eq']) chain[k] = () => chain;
  chain['maybeSingle'] = async () => result;
  return { from: () => chain } as never;
};
const page = (root: Record<string, unknown>) => db({ data: { layout_tree: { root } }, error: null });

describe('showsScrollingLine (Alex, 2026-10-22)', () => {
  it('is every mood but Scenic', async () => {
    expect(await showsScrollingLine(page({ archetypeKey: 'main-street', mood: 'cozy' }), 't1')).toBe(true);
    expect(await showsScrollingLine(page({ archetypeKey: 'main-street', mood: 'scenic' }), 't1')).toBe(false);
  });
  it('is never a custom design, or a site with no page yet', async () => {
    expect(await showsScrollingLine(page({ archetypeKey: 'boutique' }), 't1')).toBe(false);
    expect(await showsScrollingLine(page({ archetypeKey: 'card', mood: 'cheerful' }), 't1')).toBe(false);
    expect(await showsScrollingLine(db({ data: null, error: null }), 't1')).toBe(false);
  });
  it('throws a failed read', async () => {
    await expect(showsScrollingLine(db({ data: null, error: { message: 'down' } }), 't1')).rejects.toThrow('down');
  });
});

describe('isFamilySite', () => {
  it('is a family design only', async () => {
    expect(await isFamilySite(page({ archetypeKey: 'main-street' }), 't1')).toBe(true);
    expect(await isFamilySite(page({ archetypeKey: 'boutique' }), 't1')).toBe(false);
  });
});
