import { z } from 'zod';
import {
  BandSchema,
  BleedSchema,
  GridSchema,
  GutterSchema,
  MarqueeSchema,
  OverlapSchema,
  PaneSchema,
  RowSchema,
  SplitSchema,
  StackSchema,
  type BandNode,
  type BleedNode,
  type GridNode,
  type GutterNode,
  type MarqueeNode,
  type OverlapNode,
  type PaneNode,
  type RowNode,
  type SplitNode,
  type StackNode,
} from './primitives';
import {
  ButtonNodeSchema,
  CartNodeSchema,
  CollectionGridNodeSchema,
  ContactFormNodeSchema,
  DividerNodeSchema,
  EventsListNodeSchema,
  FeaturedCollectionNodeSchema,
  FeaturedProductNodeSchema,
  FeaturedSubscriptionNodeSchema,
  ImageNodeSchema,
  NavLinksNodeSchema,
  ProductGridNodeSchema,
  QuoteNodeSchema,
  SocialLinksNodeSchema,
  SubscriptionGridNodeSchema,
  TextNodeSchema,
  VideoNodeSchema,
  WordmarkNodeSchema,
  type ContentNode,
} from './content';

export type LayoutNode =
  | BandNode
  | StackNode
  | RowNode
  | SplitNode
  | GridNode
  | OverlapNode
  | BleedNode
  | PaneNode
  | MarqueeNode
  | GutterNode
  | ContentNode;

export const LayoutNodeSchema: z.ZodType<LayoutNode> = z.lazy(() =>
  z.union([
    BandSchema,
    StackSchema,
    RowSchema,
    SplitSchema,
    GridSchema,
    OverlapSchema,
    BleedSchema,
    PaneSchema,
    MarqueeSchema,
    GutterSchema,
    TextNodeSchema,
    ImageNodeSchema,
    ButtonNodeSchema,
    WordmarkNodeSchema,
    VideoNodeSchema,
    DividerNodeSchema,
    QuoteNodeSchema,
    ProductGridNodeSchema,
    FeaturedProductNodeSchema,
    CollectionGridNodeSchema,
    FeaturedCollectionNodeSchema,
    SubscriptionGridNodeSchema,
    FeaturedSubscriptionNodeSchema,
    ContactFormNodeSchema,
    CartNodeSchema,
    SocialLinksNodeSchema,
    NavLinksNodeSchema,
    EventsListNodeSchema,
  ] as unknown as [z.ZodType<LayoutNode>, z.ZodType<LayoutNode>, ...z.ZodType<LayoutNode>[]]),
) as unknown as z.ZodType<LayoutNode>;

const PageSlugSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9](?:[a-z0-9-/]*[a-z0-9])?$/, {
    message:
      'Slug must be lowercase, may contain hyphens and slashes, no leading or trailing separators',
  });

export const PageSchema = z
  .object({
    slug: PageSlugSchema,
    name: z.string().min(1).max(120),
    root: LayoutNodeSchema,
    meta: z
      .object({
        title: z.string().min(1).max(200).optional(),
        description: z.string().min(1).max(500).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type Page = z.infer<typeof PageSchema>;

export const MAX_TREE_DEPTH = 12;
export const MAX_NODE_COUNT = 600;
export const SPLIT_RATIO_SUM = 100;

export type ValidationIssue = {
  path: string;
  message: string;
};

export type ValidationResult =
  | { ok: true; page: Page }
  | { ok: false; issues: ValidationIssue[] };

function pushChildren(
  node: LayoutNode,
  basePath: string,
  out: { node: LayoutNode; path: string }[],
): void {
  switch (node.type) {
    case 'band':
    case 'stack':
    case 'row':
    case 'split':
    case 'grid':
    case 'overlap':
    case 'marquee':
      for (let i = node.children.length - 1; i >= 0; i--) {
        const child = node.children[i];
        if (child === undefined) continue;
        out.push({ node: child, path: `${basePath}.children[${i}]` });
      }
      return;
    case 'bleed':
    case 'pane':
      out.push({ node: node.child, path: `${basePath}.child` });
      return;
    default:
      return;
  }
}

function isPermutation(arr: number[], length: number): boolean {
  if (arr.length !== length) return false;
  const seen = new Set<number>();
  for (const v of arr) {
    if (!Number.isInteger(v) || v < 0 || v >= length) return false;
    if (seen.has(v)) return false;
    seen.add(v);
  }
  return true;
}

function checkSemanticRules(
  node: LayoutNode,
  path: string,
  issues: ValidationIssue[],
): void {
  if (node.type === 'split') {
    if (node.ratios.length !== node.children.length) {
      issues.push({
        path: `${path}.ratios`,
        message: `ratios length (${node.ratios.length}) must equal children length (${node.children.length})`,
      });
    }
    const sum = node.ratios.reduce((a: number, b: number) => a + b, 0);
    if (Math.abs(sum - SPLIT_RATIO_SUM) > 0.001) {
      issues.push({
        path: `${path}.ratios`,
        message: `ratios must sum to ${SPLIT_RATIO_SUM} (got ${sum})`,
      });
    }
    if (node.mobile?.stackOrder !== undefined) {
      if (!isPermutation(node.mobile.stackOrder, node.children.length)) {
        issues.push({
          path: `${path}.mobile.stackOrder`,
          message: `stackOrder must be a permutation of [0..${node.children.length - 1}]`,
        });
      }
    }
    return;
  }

  if (node.type === 'overlap') {
    if (node.anchor >= node.children.length) {
      issues.push({
        path: `${path}.anchor`,
        message: `anchor (${node.anchor}) must be less than children length (${node.children.length})`,
      });
    }
    if (node.children.length === 0) {
      issues.push({
        path: `${path}.children`,
        message: 'overlap must have at least one child',
      });
    }
    if (node.mobile?.stackOrder !== undefined) {
      if (!isPermutation(node.mobile.stackOrder, node.children.length)) {
        issues.push({
          path: `${path}.mobile.stackOrder`,
          message: `stackOrder must be a permutation of [0..${node.children.length - 1}]`,
        });
      }
    }
    return;
  }

  if (
    (node.type === 'productGrid' || node.type === 'collectionGrid') &&
    node.order === 'manual'
  ) {
    const manual =
      node.type === 'productGrid' ? node.manualIds : node.manualSlugs;
    if (manual === undefined || manual.length === 0) {
      issues.push({
        path: `${path}.${node.type === 'productGrid' ? 'manualIds' : 'manualSlugs'}`,
        message: 'manual order requires manual list to be set',
      });
    }
  }
}

function walkTree(root: LayoutNode, issues: ValidationIssue[]): void {
  const stack: { node: LayoutNode; path: string; depth: number }[] = [
    { node: root, path: 'root', depth: 1 },
  ];
  let count = 0;

  while (stack.length > 0) {
    const { node, path, depth } = stack.pop()!;
    count += 1;

    if (count > MAX_NODE_COUNT) {
      issues.push({
        path,
        message: `tree exceeds maximum node count (${MAX_NODE_COUNT})`,
      });
      return;
    }

    if (depth > MAX_TREE_DEPTH) {
      issues.push({
        path,
        message: `tree exceeds maximum depth (${MAX_TREE_DEPTH})`,
      });
      return;
    }

    checkSemanticRules(node, path, issues);

    const childEntries: { node: LayoutNode; path: string }[] = [];
    pushChildren(node, path, childEntries);
    for (const entry of childEntries) {
      stack.push({ node: entry.node, path: entry.path, depth: depth + 1 });
    }
  }
}

export function validatePage(input: unknown): ValidationResult {
  const parsed = PageSchema.safeParse(input);
  if (!parsed.success) {
    const issues: ValidationIssue[] = parsed.error.issues.map((i: z.ZodIssue) => ({
      path: i.path.join('.') || '(root)',
      message: i.message,
    }));
    return { ok: false, issues };
  }
  const issues: ValidationIssue[] = [];
  walkTree(parsed.data.root, issues);
  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, page: parsed.data };
}

export function validateLayoutNode(input: unknown): ValidationResult {
  const parsed = LayoutNodeSchema.safeParse(input);
  if (!parsed.success) {
    const issues: ValidationIssue[] = parsed.error.issues.map((i: z.ZodIssue) => ({
      path: i.path.join('.') || '(root)',
      message: i.message,
    }));
    return { ok: false, issues };
  }
  const issues: ValidationIssue[] = [];
  walkTree(parsed.data, issues);
  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return {
    ok: true,
    page: {
      slug: 'inline',
      name: 'inline',
      root: parsed.data,
    },
  };
}
