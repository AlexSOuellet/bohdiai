import { describe, it, expect, vi, beforeEach } from 'vitest';

const from = vi.fn();
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({ from }) }));

import { loadDraftEnvelope, loadHomeEnvelope, loadTenantChrome } from './load-envelope';

/** Chainable query stub whose `.maybeSingle()` resolves to `result`. */
function query(result: unknown) {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'eq']) chain[m] = vi.fn(() => chain);
  chain['maybeSingle'] = vi.fn(() => Promise.resolve(result));
  return chain;
}

beforeEach(() => from.mockReset());

describe('loadDraftEnvelope', () => {
  it('returns the archetype root of a draft', async () => {
    from.mockReturnValue(query({ data: { layout_tree: { root: { kind: 'archetype', lookKey: 'ember' } } } }));
    expect(await loadDraftEnvelope('t1')).toEqual({ kind: 'archetype', lookKey: 'ember' });
  });

  it('returns null when there is no draft', async () => {
    from.mockReturnValue(query({ data: null }));
    expect(await loadDraftEnvelope('t1')).toBeNull();
  });

  it('returns null when the draft root is not an archetype envelope', async () => {
    from.mockReturnValue(query({ data: { layout_tree: { root: { kind: 'legacy' } } } }));
    expect(await loadDraftEnvelope('t1')).toBeNull();
  });
});

describe('loadDraftEnvelope — malformed trees', () => {
  it.each([
    ['a layout_tree that is null', { layout_tree: null }],
    ['a layout_tree that is not an object', { layout_tree: 'root' }],
    ['a layout_tree that is an array', { layout_tree: [{ kind: 'archetype' }] }],
    ['a null root', { layout_tree: { root: null } }],
    ['a root that is not an object', { layout_tree: { root: 7 } }],
    ['a root that is an array', { layout_tree: { root: [] } }],
  ])('returns null for %s', async (_label, data) => {
    from.mockReturnValue(query({ data }));
    expect(await loadDraftEnvelope('t-draft')).toBeNull();
  });
});

describe('loadHomeEnvelope', () => {
  it('reads the published home page for the tenant and returns its archetype root', async () => {
    const q = query({ data: { layout_tree: { root: { kind: 'archetype', mood: 'cozy' } } } });
    from.mockReturnValue(q);
    expect(await loadHomeEnvelope('t-home-1')).toEqual({ kind: 'archetype', mood: 'cozy' });
    expect(from).toHaveBeenCalledWith('content_pages');
    const eq = q['eq'] as ReturnType<typeof vi.fn>;
    expect(eq).toHaveBeenCalledWith('tenant_id', 't-home-1');
    expect(eq).toHaveBeenCalledWith('slug', '/');
    expect(eq).toHaveBeenCalledWith('status', 'published');
  });

  it('returns null when there is no published home', async () => {
    from.mockReturnValue(query({ data: null }));
    expect(await loadHomeEnvelope('t-home-2')).toBeNull();
  });

  it('returns null when the root is not an archetype envelope', async () => {
    from.mockReturnValue(query({ data: { layout_tree: { root: { kind: 'legacy' } } } }));
    expect(await loadHomeEnvelope('t-home-3')).toBeNull();
  });

  it.each([
    ['a non-object layout_tree', { layout_tree: 5 }],
    ['an array layout_tree', { layout_tree: [] }],
    ['a null root', { layout_tree: { root: null } }],
    ['a non-object root', { layout_tree: { root: 'x' } }],
    ['an array root', { layout_tree: { root: [1] } }],
  ])('returns null for %s', async (_label, data) => {
    from.mockReturnValue(query({ data }));
    expect(await loadHomeEnvelope('t-home-4')).toBeNull();
  });
});

describe('loadTenantChrome', () => {
  it('returns the logo, brand colors and original mood', async () => {
    const q = query({ data: { logo_url: 'https://x/logo.png', brand_colors: ['#112233'], mood_key: 'cheerful' } });
    from.mockReturnValue(q);
    expect(await loadTenantChrome('t-chrome-1')).toEqual({
      logoUrl: 'https://x/logo.png',
      brandColors: ['#112233'],
      moodKey: 'cheerful',
    });
    expect(from).toHaveBeenCalledWith('tenants');
    expect(q['eq'] as ReturnType<typeof vi.fn>).toHaveBeenCalledWith('id', 't-chrome-1');
  });

  it('falls back to undefined / [] when the columns are null', async () => {
    from.mockReturnValue(query({ data: { logo_url: null, brand_colors: null, mood_key: null } }));
    expect(await loadTenantChrome('t-chrome-2')).toEqual({ logoUrl: undefined, brandColors: [], moodKey: undefined });
  });

  it('falls back to undefined / [] when the tenant row is missing', async () => {
    from.mockReturnValue(query({ data: null }));
    expect(await loadTenantChrome('t-chrome-3')).toEqual({ logoUrl: undefined, brandColors: [], moodKey: undefined });
  });
});
