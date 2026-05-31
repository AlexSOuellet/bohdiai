import { describe, it, expect, vi } from 'vitest';
import { resolvePage } from './resolved';
import type {
  ResolveContext,
  ResolvedCart,
  ResolvedCollection,
  ResolvedEvent,
  ResolvedNavLink,
  ResolvedProduct,
  ResolvedSocialLink,
  ResolvedSubscription,
} from './resolved';
import type { LayoutNode, Page } from './tree';

function makeProduct(id: string): ResolvedProduct {
  return { id, slug: `s-${id}`, name: `n-${id}`, isPreview: false };
}

function makeCollection(slug: string): ResolvedCollection {
  return { slug, name: `n-${slug}`, itemCount: 1 };
}

function makeSubscription(id: string): ResolvedSubscription {
  return { id, name: `n-${id}`, priceCents: 100, interval: 'monthly', perks: [] };
}

function ctx(overrides: Partial<ResolveContext> = {}): ResolveContext {
  const base: ResolveContext = {
    tenantId: 't1',
    fetchProducts: vi.fn().mockResolvedValue([makeProduct('p1')]),
    fetchProduct: vi.fn().mockResolvedValue(makeProduct('p9')),
    fetchCollections: vi.fn().mockResolvedValue([makeCollection('c1')]),
    fetchCollection: vi.fn().mockResolvedValue(makeCollection('cf')),
    fetchSubscriptions: vi.fn().mockResolvedValue([makeSubscription('s1')]),
    fetchSubscription: vi.fn().mockResolvedValue(makeSubscription('s9')),
    fetchSocialLinks: vi
      .fn()
      .mockResolvedValue([{ platform: 'ig', url: 'https://i' } as ResolvedSocialLink]),
    fetchNavLinks: vi
      .fn()
      .mockResolvedValue([{ slug: 'about', label: 'About', order: 0 } as ResolvedNavLink]),
    fetchEvents: vi
      .fn()
      .mockResolvedValue([{ id: 'e1', name: 'Show', date: '2026-06-01' } as ResolvedEvent]),
    fetchCart: vi.fn().mockResolvedValue({ lines: [], subtotalCents: 0 } as ResolvedCart),
  };
  return { ...base, ...overrides };
}

function page(root: LayoutNode): Page {
  return { slug: 'home', name: 'Home', root };
}

describe('resolvePage', () => {
  it('returns empty map for a tree with no bound nodes', async () => {
    const root: LayoutNode = {
      type: 'stack',
      children: [{ type: 'text', role: 'body', content: 'x' }],
    };
    const result = await resolvePage(page(root), ctx());
    expect(result).toEqual({});
  });

  it('resolves productGrid with defaults and passes args through', async () => {
    const fp = vi.fn().mockResolvedValue([makeProduct('p1')]);
    const root: LayoutNode = { type: 'productGrid' };
    const result = await resolvePage(page(root), ctx({ fetchProducts: fp }));
    expect(fp).toHaveBeenCalledWith({ count: 6, order: undefined });
    expect(result['root']).toBeDefined();
  });

  it('resolves productGrid with filter and manualIds', async () => {
    const fp = vi.fn().mockResolvedValue([]);
    const root: LayoutNode = {
      type: 'productGrid',
      count: 4,
      order: 'manual',
      filter: { collectionSlug: 'wax' },
      manualIds: ['x'],
    };
    await resolvePage(page(root), ctx({ fetchProducts: fp }));
    expect(fp).toHaveBeenCalledWith({
      count: 4,
      order: 'manual',
      filter: { collectionSlug: 'wax' },
      manualIds: ['x'],
    });
  });

  it('resolves featuredProduct', async () => {
    const fp = vi.fn().mockResolvedValue(makeProduct('px'));
    const root: LayoutNode = { type: 'featuredProduct', productId: 'px' };
    const result = await resolvePage(page(root), ctx({ fetchProduct: fp }));
    expect(fp).toHaveBeenCalledWith('px');
    expect(result['root']).toBeDefined();
  });

  it('skips featuredProduct when fetch returns undefined', async () => {
    const fp = vi.fn().mockResolvedValue(undefined);
    const root: LayoutNode = { type: 'featuredProduct', productId: 'gone' };
    const result = await resolvePage(page(root), ctx({ fetchProduct: fp }));
    expect(result).toEqual({});
  });

  it('resolves collectionGrid defaults', async () => {
    const fc = vi.fn().mockResolvedValue([makeCollection('c')]);
    const root: LayoutNode = { type: 'collectionGrid' };
    await resolvePage(page(root), ctx({ fetchCollections: fc }));
    expect(fc).toHaveBeenCalledWith({ count: 3, order: undefined });
  });

  it('resolves collectionGrid with manualSlugs', async () => {
    const fc = vi.fn().mockResolvedValue([]);
    const root: LayoutNode = {
      type: 'collectionGrid',
      count: 5,
      order: 'manual',
      manualSlugs: ['a'],
    };
    await resolvePage(page(root), ctx({ fetchCollections: fc }));
    expect(fc).toHaveBeenCalledWith({ count: 5, order: 'manual', manualSlugs: ['a'] });
  });

  it('resolves featuredCollection', async () => {
    const f = vi.fn().mockResolvedValue(makeCollection('cs'));
    const root: LayoutNode = { type: 'featuredCollection', collectionSlug: 'cs' };
    const result = await resolvePage(page(root), ctx({ fetchCollection: f }));
    expect(f).toHaveBeenCalledWith('cs');
    expect(result['root']).toBeDefined();
  });

  it('resolves subscriptionGrid default count', async () => {
    const fs = vi.fn().mockResolvedValue([makeSubscription('s1')]);
    const root: LayoutNode = { type: 'subscriptionGrid' };
    await resolvePage(page(root), ctx({ fetchSubscriptions: fs }));
    expect(fs).toHaveBeenCalledWith(3);
  });

  it('resolves subscriptionGrid with custom count', async () => {
    const fs = vi.fn().mockResolvedValue([]);
    const root: LayoutNode = { type: 'subscriptionGrid', count: 8 };
    await resolvePage(page(root), ctx({ fetchSubscriptions: fs }));
    expect(fs).toHaveBeenCalledWith(8);
  });

  it('resolves featuredSubscription', async () => {
    const fs = vi.fn().mockResolvedValue(makeSubscription('sx'));
    const root: LayoutNode = { type: 'featuredSubscription', subscriptionId: 'sx' };
    const result = await resolvePage(page(root), ctx({ fetchSubscription: fs }));
    expect(fs).toHaveBeenCalledWith('sx');
    expect(result['root']).toBeDefined();
  });

  it('resolves socialLinks and navLinks and cart', async () => {
    const root: LayoutNode = {
      type: 'stack',
      children: [{ type: 'socialLinks' }, { type: 'navLinks' }, { type: 'cart', variant: 'icon' }],
    };
    const result = await resolvePage(page(root), ctx());
    expect(result['root.children[0]']).toBeDefined();
    expect(result['root.children[1]']).toBeDefined();
    expect(result['root.children[2]']).toBeDefined();
  });

  it('resolves eventsList with defaults', async () => {
    const fe = vi.fn().mockResolvedValue([{ id: 'e', name: 'n', date: 'd' } as ResolvedEvent]);
    const root: LayoutNode = { type: 'eventsList' };
    await resolvePage(page(root), ctx({ fetchEvents: fe }));
    expect(fe).toHaveBeenCalledWith({ count: 3, upcoming: true });
  });

  it('resolves eventsList with explicit args', async () => {
    const fe = vi.fn().mockResolvedValue([]);
    const root: LayoutNode = { type: 'eventsList', count: 12, upcoming: false };
    await resolvePage(page(root), ctx({ fetchEvents: fe }));
    expect(fe).toHaveBeenCalledWith({ count: 12, upcoming: false });
  });

  it('contactForm returns undefined and is omitted', async () => {
    const root: LayoutNode = { type: 'contactForm' };
    const result = await resolvePage(page(root), ctx());
    expect(result).toEqual({});
  });

  it('walks nested primitives (band, row, grid, split, overlap, marquee, bleed, pane) and indexes by path', async () => {
    const fp = vi.fn().mockResolvedValue([makeProduct('p')]);
    const root: LayoutNode = {
      type: 'band',
      children: [
        {
          type: 'row',
          children: [{ type: 'grid', columns: 1, children: [{ type: 'productGrid' }] }],
        },
        {
          type: 'split',
          direction: 'horizontal',
          ratios: [50, 50],
          children: [
            { type: 'overlap', anchor: 0, children: [{ type: 'productGrid' }] },
            { type: 'marquee', children: [{ type: 'productGrid' }] },
          ],
        },
        { type: 'bleed', side: 'all', child: { type: 'pane', child: { type: 'productGrid' } } },
      ],
    };
    const result = await resolvePage(page(root), ctx({ fetchProducts: fp }));
    expect(fp).toHaveBeenCalledTimes(4);
    expect(Object.keys(result).sort()).toEqual([
      'root.children[0].children[0].children[0]',
      'root.children[1].children[0].children[0]',
      'root.children[1].children[1].children[0]',
      'root.children[2].child.child',
    ]);
  });

  it('runs bound fetchers in parallel (all start before any finishes)', async () => {
    const events: string[] = [];
    const slow = (label: string, ms: number) =>
      new Promise<ResolvedProduct[]>((resolve) => {
        events.push(`start:${label}`);
        setTimeout(() => {
          events.push(`end:${label}`);
          resolve([]);
        }, ms);
      });

    const fp = vi
      .fn()
      .mockImplementationOnce(() => slow('a', 30))
      .mockImplementationOnce(() => slow('b', 10));

    const root: LayoutNode = {
      type: 'stack',
      children: [{ type: 'productGrid' }, { type: 'productGrid' }],
    };
    await resolvePage(page(root), ctx({ fetchProducts: fp }));

    // Both starts before either end => parallel.
    expect(events.indexOf('start:b')).toBeLessThan(events.indexOf('end:a'));
    expect(events).toEqual(['start:a', 'start:b', 'end:b', 'end:a']);
  });
});
