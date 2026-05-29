import type {
  FeaturedSubscriptionNode,
  ResolvedSubscription,
} from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';

function formatPriceCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function resolvedSubscriptionAt(
  ctx: RenderContext,
): ResolvedSubscription | null {
  if (ctx.resolved === undefined || ctx.path === undefined) return null;
  const data = ctx.resolved[ctx.path];
  if (Array.isArray(data) || data === undefined || data === null) return null;
  return data as ResolvedSubscription;
}

export function FeaturedSubscriptionContent({
  node,
  ctx,
}: {
  node: FeaturedSubscriptionNode;
  ctx: RenderContext;
}) {
  const sub = resolvedSubscriptionAt(ctx);

  if (sub === null) {
    return (
      <div
        data-node-type="featuredSubscription"
        data-node-id={node.id}
        data-bound-placeholder
        data-subscription-id={node.subscriptionId}
        style={intentToStyleVars(node.intent)}
        className="flex flex-col gap-3 p-8 border border-black/10 rounded-lg max-w-md"
      >
        <div className="h-7 w-2/3 bg-black/10 rounded" />
        <div className="h-5 w-1/3 bg-black/10 rounded" />
        <div className="h-4 w-full bg-black/10 rounded" />
      </div>
    );
  }

  return (
    <div
      data-node-type="featuredSubscription"
      data-node-id={node.id}
      style={intentToStyleVars(node.intent)}
      className="flex flex-col gap-3 p-8 border border-black/10 rounded-lg max-w-md"
    >
      <h3 className="text-2xl font-semibold">{sub.name}</h3>
      <div className="text-lg opacity-80">
        {formatPriceCents(sub.priceCents)} / {sub.interval}
      </div>
      {sub.description !== undefined && (
        <p className="text-sm opacity-70 leading-relaxed">{sub.description}</p>
      )}
      <a
        href={`/subscriptions#${sub.id}`}
        className="mt-4 inline-flex items-center justify-center px-6 py-3 rounded-md bg-black text-white font-medium"
      >
        Subscribe
      </a>
    </div>
  );
}
