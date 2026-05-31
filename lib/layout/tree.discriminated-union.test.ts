import { describe, it, expect } from 'vitest';
import { performance } from 'node:perf_hooks';
import { PageSchema } from './tree';
import type { LayoutNode } from './tree';

const leaf = (content = 'x'): LayoutNode => ({
  type: 'text',
  role: 'body',
  content,
});

// A deeply nested chain alternating band/stack. Under the old plain-union
// schema this triggered exponential backtracking (~7^depth) because every node
// was tried against all ~10 container schemas, each recursing into the full
// subtree before failing. With a discriminated union it is linear in node
// count. Depth 12 matches MAX_TREE_DEPTH and parsed in seconds before the fix.
function buildDeepTree(depth: number): LayoutNode {
  if (depth <= 0) return leaf();
  const type = depth % 2 === 0 ? 'band' : 'stack';
  return { type, children: [leaf(), buildDeepTree(depth - 1)] } as LayoutNode;
}

describe('LayoutNodeSchema discriminated-union performance', () => {
  it('validates a deep tree in well under a second', () => {
    const input = { slug: 'home', name: 'Home', root: buildDeepTree(12) };

    const start = performance.now();
    const result = PageSchema.safeParse(input);
    const elapsedMs = performance.now() - start;

    expect(result.success).toBe(true);
    // Post-fix this is single-digit milliseconds. The pre-fix plain union took
    // multiple seconds on real trees and far longer here — a generous 1s bound
    // catches any reintroduction of the exponential blowup without flaking.
    expect(elapsedMs).toBeLessThan(1000);
  });

  it('still rejects an unknown node type deep in the tree', () => {
    const root = buildDeepTree(8) as { children: LayoutNode[] };
    root.children[1] = { type: 'mystery' } as unknown as LayoutNode;

    const result = PageSchema.safeParse({
      slug: 'home',
      name: 'Home',
      root: root as unknown as LayoutNode,
    });
    expect(result.success).toBe(false);
  });
});
