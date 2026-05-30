import { describe, it, expect } from 'vitest';
import {
  PageSchema,
  LayoutNodeSchema,
  validatePage,
  validateLayoutNode,
  walkTree,
  MAX_TREE_DEPTH,
  MAX_NODE_COUNT,
} from './tree';
import type { LayoutNode, ValidationIssue } from './tree';

const text = (content = 'hi'): LayoutNode => ({ type: 'text', role: 'body', content });

describe('PageSchema', () => {
  it('accepts a basic page', () => {
    const r = PageSchema.parse({ slug: 'home', name: 'Home', root: text() });
    expect(r.slug).toBe('home');
  });
  it('accepts with meta', () => {
    const r = PageSchema.parse({
      slug: 'about', name: 'About', root: text(),
      meta: { title: 'About us', description: 'd' },
    });
    expect(r.meta?.title).toBe('About us');
  });
  it('rejects bad slug uppercase', () => {
    expect(PageSchema.safeParse({ slug: 'Home', name: 'x', root: text() }).success).toBe(false);
  });
  it('rejects slug with leading slash', () => {
    expect(PageSchema.safeParse({ slug: '/home', name: 'x', root: text() }).success).toBe(false);
  });
  it('rejects empty name', () => {
    expect(PageSchema.safeParse({ slug: 'h', name: '', root: text() }).success).toBe(false);
  });
  it('accepts slug with hyphens and slashes', () => {
    expect(PageSchema.parse({ slug: 'shop/wax-collection', name: 'X', root: text() }).slug).toBe(
      'shop/wax-collection',
    );
  });
});

describe('LayoutNodeSchema', () => {
  it('accepts a primitive', () => {
    expect(LayoutNodeSchema.safeParse({ type: 'stack', children: [] }).success).toBe(true);
  });
  it('accepts a content node', () => {
    expect(LayoutNodeSchema.safeParse(text()).success).toBe(true);
  });
  it('rejects unknown type', () => {
    expect(LayoutNodeSchema.safeParse({ type: 'mystery' }).success).toBe(false);
  });
});

describe('validatePage — schema-level failures', () => {
  it('returns issues with paths', () => {
    const r = validatePage({ slug: 'X', name: 'X', root: text() });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.issues.length).toBeGreaterThan(0);
      expect(r.issues[0]?.path).toBeDefined();
    }
  });

  it('reports (root) when path is empty', () => {
    const r = validatePage(undefined);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.issues.some((i) => i.path === '(root)')).toBe(true);
    }
  });
});

describe('validatePage — happy path', () => {
  it('returns ok for a simple valid page', () => {
    const r = validatePage({ slug: 'home', name: 'Home', root: text() });
    expect(r.ok).toBe(true);
  });

  it('walks band/stack/row/grid/marquee children', () => {
    const root: LayoutNode = {
      type: 'band',
      children: [
        { type: 'stack', children: [text()] },
        { type: 'row', children: [text()] },
        { type: 'grid', columns: 2, children: [text()] },
        { type: 'marquee', children: [text()] },
      ],
    };
    expect(validatePage({ slug: 'h', name: 'h', root }).ok).toBe(true);
  });

  it('walks bleed and pane child', () => {
    const root: LayoutNode = {
      type: 'bleed', side: 'all',
      child: { type: 'pane', child: text() },
    };
    expect(validatePage({ slug: 'h', name: 'h', root }).ok).toBe(true);
  });
});

describe('validatePage — split rules', () => {
  it('rejects split where ratios do not sum to 100', () => {
    const root: LayoutNode = {
      type: 'split', direction: 'horizontal', ratios: [40, 40], children: [text(), text()],
    };
    const r = validatePage({ slug: 'h', name: 'h', root });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.message.includes('sum to 100'))).toBe(true);
  });

  it('rejects split where ratios length != children length', () => {
    const root: LayoutNode = {
      type: 'split', direction: 'horizontal', ratios: [50, 50], children: [text()],
    };
    const r = validatePage({ slug: 'h', name: 'h', root });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.message.includes('ratios length'))).toBe(true);
  });

  it('rejects split where mobile.stackOrder is not a permutation (wrong length)', () => {
    const root: LayoutNode = {
      type: 'split', direction: 'horizontal', ratios: [50, 50],
      children: [text(), text()],
      mobile: { stackOrder: [0] },
    };
    const r = validatePage({ slug: 'h', name: 'h', root });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.path.endsWith('stackOrder'))).toBe(true);
  });

  it('rejects split where mobile.stackOrder is not a permutation (duplicates)', () => {
    const root: LayoutNode = {
      type: 'split', direction: 'horizontal', ratios: [50, 50],
      children: [text(), text()],
      mobile: { stackOrder: [0, 0] },
    };
    expect(validatePage({ slug: 'h', name: 'h', root }).ok).toBe(false);
  });

  it('rejects split where mobile.stackOrder has out-of-range index', () => {
    const root: LayoutNode = {
      type: 'split', direction: 'horizontal', ratios: [50, 50],
      children: [text(), text()],
      mobile: { stackOrder: [0, 5] },
    };
    expect(validatePage({ slug: 'h', name: 'h', root }).ok).toBe(false);
  });

  it('accepts valid split with valid stackOrder', () => {
    const root: LayoutNode = {
      type: 'split', direction: 'horizontal', ratios: [50, 50],
      children: [text(), text()],
      mobile: { stackOrder: [1, 0] },
    };
    expect(validatePage({ slug: 'h', name: 'h', root }).ok).toBe(true);
  });
});

describe('validatePage — overlap rules', () => {
  it('rejects overlap with anchor out of bounds', () => {
    const root: LayoutNode = { type: 'overlap', anchor: 5, children: [text()] };
    const r = validatePage({ slug: 'h', name: 'h', root });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.message.includes('anchor'))).toBe(true);
  });

  it('rejects overlap with no children', () => {
    // anchor 0, children []: schema allows, but walker should reject
    const root = { type: 'overlap', anchor: 0, children: [] } as unknown as LayoutNode;
    const r = validatePage({ slug: 'h', name: 'h', root });
    expect(r.ok).toBe(false);
  });

  it('rejects overlap with bad mobile.stackOrder', () => {
    const root: LayoutNode = {
      type: 'overlap', anchor: 0, children: [text(), text()],
      mobile: { stackOrder: [0, 5] },
    };
    expect(validatePage({ slug: 'h', name: 'h', root }).ok).toBe(false);
  });

  it('accepts overlap with valid mobile.stackOrder', () => {
    const root: LayoutNode = {
      type: 'overlap', anchor: 0, children: [text(), text()],
      mobile: { stackOrder: [1, 0] },
    };
    expect(validatePage({ slug: 'h', name: 'h', root }).ok).toBe(true);
  });
});

describe('validatePage — manual-order rules', () => {
  it('rejects productGrid with order=manual and no manualIds', () => {
    const root: LayoutNode = { type: 'productGrid', order: 'manual' };
    const r = validatePage({ slug: 'h', name: 'h', root });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.path.endsWith('manualIds'))).toBe(true);
  });

  it('rejects productGrid with order=manual and empty manualIds', () => {
    const root: LayoutNode = { type: 'productGrid', order: 'manual', manualIds: [] };
    expect(validatePage({ slug: 'h', name: 'h', root }).ok).toBe(false);
  });

  it('accepts productGrid with manual ids', () => {
    const root: LayoutNode = { type: 'productGrid', order: 'manual', manualIds: ['p1'] };
    expect(validatePage({ slug: 'h', name: 'h', root }).ok).toBe(true);
  });

  it('rejects collectionGrid with order=manual and no manualSlugs', () => {
    const root: LayoutNode = { type: 'collectionGrid', order: 'manual' };
    const r = validatePage({ slug: 'h', name: 'h', root });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.path.endsWith('manualSlugs'))).toBe(true);
  });

  it('accepts collectionGrid with manual slugs', () => {
    const root: LayoutNode = { type: 'collectionGrid', order: 'manual', manualSlugs: ['x'] };
    expect(validatePage({ slug: 'h', name: 'h', root }).ok).toBe(true);
  });

  it('accepts productGrid with non-manual order', () => {
    const root: LayoutNode = { type: 'productGrid', order: 'newest' };
    expect(validatePage({ slug: 'h', name: 'h', root }).ok).toBe(true);
  });
});

describe('walkTree — depth and count limits (called directly to bypass Zod recursion cost)', () => {
  it('rejects tree exceeding MAX_TREE_DEPTH', () => {
    let cur: LayoutNode = text();
    for (let i = 0; i < MAX_TREE_DEPTH + 2; i++) {
      cur = { type: 'stack', children: [cur] };
    }
    const issues: ValidationIssue[] = [];
    walkTree(cur, issues);
    expect(issues.some((i) => i.message.includes('maximum depth'))).toBe(true);
  });

  it('rejects tree exceeding MAX_NODE_COUNT', () => {
    const kids: LayoutNode[] = [];
    for (let i = 0; i < MAX_NODE_COUNT + 5; i++) kids.push(text(`x${i}`));
    const root: LayoutNode = { type: 'stack', children: kids };
    const issues: ValidationIssue[] = [];
    walkTree(root, issues);
    expect(issues.some((i) => i.message.includes('maximum node count'))).toBe(true);
  });

  it('walker skips undefined child entries gracefully', () => {
    // Defensive branch in pushChildren — sparse arrays cannot survive Zod
    // parsing but the walker still guards against it.
    const sparse: LayoutNode[] = [text()];
    sparse.length = 3;
    sparse[2] = text('end');
    const root: LayoutNode = { type: 'stack', children: sparse };
    const issues: ValidationIssue[] = [];
    walkTree(root, issues);
    expect(issues).toEqual([]);
  });
});

describe('validateLayoutNode', () => {
  it('returns ok for a valid root node and wraps it in an inline Page', () => {
    const r = validateLayoutNode(text());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.page.slug).toBe('inline');
      expect(r.page.name).toBe('inline');
    }
  });

  it('returns schema issues for invalid input', () => {
    const r = validateLayoutNode({ type: 'mystery' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.length).toBeGreaterThan(0);
  });

  it('returns walker issues for valid schema but invalid semantics', () => {
    const r = validateLayoutNode({
      type: 'split', direction: 'horizontal', ratios: [50, 50], children: [text()],
    });
    expect(r.ok).toBe(false);
  });

  it('returns (root) path on schema-level error with empty path', () => {
    const r = validateLayoutNode(undefined);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.issues.some((i) => i.path === '(root)')).toBe(true);
    }
  });
});
