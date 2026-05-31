import type {
  CartNode,
  CollectionGridNode,
  ContactFormNode,
  EventsListNode,
  FeaturedCollectionNode,
  FeaturedProductNode,
  FeaturedSubscriptionNode,
  LayoutNode,
  NavLinksNode,
  Page,
  ProductGridNode,
  SocialLinksNode,
  SubscriptionGridNode,
} from './index';

export interface ResolvedProduct {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string;
  priceCents?: number;
  imageUrl?: string;
  isPreview: boolean;
}

export interface ResolvedCollection {
  slug: string;
  name: string;
  imageUrl?: string;
  itemCount: number;
}

export interface ResolvedSubscription {
  id: string;
  name: string;
  priceCents: number;
  interval: string;
  description?: string;
  perks: string[];
}

export interface ResolvedSocialLink {
  platform: string;
  url: string;
}

export interface ResolvedNavLink {
  slug: string;
  label: string;
  order: number;
}

export interface ResolvedEvent {
  id: string;
  name: string;
  date: string;
  location?: string;
  description?: string;
}

export interface ResolvedCartLine {
  productId: string;
  productName: string;
  imageUrl?: string;
  quantity: number;
  priceCents: number;
}

export interface ResolvedCart {
  lines: ResolvedCartLine[];
  subtotalCents: number;
}

export type ResolvedDataByNodePath = {
  [path: string]:
    | ResolvedProduct[]
    | ResolvedProduct
    | ResolvedCollection[]
    | ResolvedCollection
    | ResolvedSubscription[]
    | ResolvedSubscription
    | ResolvedSocialLink[]
    | ResolvedNavLink[]
    | ResolvedEvent[]
    | ResolvedCart;
};

export interface ResolveContext {
  tenantId: string;
  fetchProducts: (args: {
    count: number;
    order: ProductGridNode['order'];
    filter?: ProductGridNode['filter'];
    manualIds?: string[];
  }) => Promise<ResolvedProduct[]>;
  fetchProduct: (id: string) => Promise<ResolvedProduct | undefined>;
  fetchCollections: (args: {
    count: number;
    order: CollectionGridNode['order'];
    manualSlugs?: string[];
  }) => Promise<ResolvedCollection[]>;
  fetchCollection: (slug: string) => Promise<ResolvedCollection | undefined>;
  fetchSubscriptions: (count: number) => Promise<ResolvedSubscription[]>;
  fetchSubscription: (id: string) => Promise<ResolvedSubscription | undefined>;
  fetchSocialLinks: () => Promise<ResolvedSocialLink[]>;
  fetchNavLinks: () => Promise<ResolvedNavLink[]>;
  fetchEvents: (args: { count: number; upcoming: boolean }) => Promise<ResolvedEvent[]>;
  fetchCart: () => Promise<ResolvedCart>;
}

function walk(node: LayoutNode, path: string, out: { node: LayoutNode; path: string }[]): void {
  out.push({ node, path });
  switch (node.type) {
    case 'band':
    case 'stack':
    case 'row':
    case 'split':
    case 'grid':
    case 'overlap':
    case 'marquee':
      node.children.forEach((child, i) => walk(child, `${path}.children[${i}]`, out));
      return;
    case 'bleed':
    case 'pane':
      walk(node.child, `${path}.child`, out);
      return;
    default:
      return;
  }
}

function isBound(node: LayoutNode): boolean {
  switch (node.type) {
    case 'productGrid':
    case 'featuredProduct':
    case 'collectionGrid':
    case 'featuredCollection':
    case 'subscriptionGrid':
    case 'featuredSubscription':
    case 'socialLinks':
    case 'navLinks':
    case 'eventsList':
    case 'cart':
    case 'contactForm':
      return true;
    default:
      return false;
  }
}

async function resolveNode(node: LayoutNode, ctx: ResolveContext): Promise<unknown | undefined> {
  switch (node.type) {
    case 'productGrid': {
      const n = node as ProductGridNode;
      return ctx.fetchProducts({
        count: n.count ?? 6,
        order: n.order,
        ...(n.filter !== undefined ? { filter: n.filter } : {}),
        ...(n.manualIds !== undefined ? { manualIds: n.manualIds } : {}),
      });
    }
    case 'featuredProduct': {
      const n = node as FeaturedProductNode;
      return ctx.fetchProduct(n.productId);
    }
    case 'collectionGrid': {
      const n = node as CollectionGridNode;
      return ctx.fetchCollections({
        count: n.count ?? 3,
        order: n.order,
        ...(n.manualSlugs !== undefined ? { manualSlugs: n.manualSlugs } : {}),
      });
    }
    case 'featuredCollection': {
      const n = node as FeaturedCollectionNode;
      return ctx.fetchCollection(n.collectionSlug);
    }
    case 'subscriptionGrid': {
      const n = node as SubscriptionGridNode;
      return ctx.fetchSubscriptions(n.count ?? 3);
    }
    case 'featuredSubscription': {
      const n = node as FeaturedSubscriptionNode;
      return ctx.fetchSubscription(n.subscriptionId);
    }
    case 'socialLinks':
      void (node as SocialLinksNode);
      return ctx.fetchSocialLinks();
    case 'navLinks':
      void (node as NavLinksNode);
      return ctx.fetchNavLinks();
    case 'eventsList': {
      const n = node as EventsListNode;
      return ctx.fetchEvents({
        count: n.count ?? 3,
        upcoming: n.upcoming ?? true,
      });
    }
    case 'cart':
      void (node as CartNode);
      return ctx.fetchCart();
    case 'contactForm':
      void (node as ContactFormNode);
      return undefined;
    default:
      return undefined;
  }
}

export async function resolvePage(
  page: Page,
  ctx: ResolveContext,
): Promise<ResolvedDataByNodePath> {
  const nodes: { node: LayoutNode; path: string }[] = [];
  walk(page.root, 'root', nodes);

  const bound = nodes.filter((n) => isBound(n.node));
  const resolved: ResolvedDataByNodePath = {};

  await Promise.all(
    bound.map(async ({ node, path }) => {
      const data = await resolveNode(node, ctx);
      if (data !== undefined) {
        resolved[path] = data as ResolvedDataByNodePath[string];
      }
    }),
  );

  return resolved;
}
