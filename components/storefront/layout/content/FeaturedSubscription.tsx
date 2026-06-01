import type {
  FeaturedSubscriptionNode,
  ResolvedSubscription,
} from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars, typeRoleStyle } from '../intent';

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
        style={{ ...intentToStyleVars(node.intent), borderColor: 'var(--color-outline)' }}
        className="flex flex-col gap-3 p-8 border rounded-lg max-w-md"
      >
        <div style={{ background: 'var(--color-surface-variant)' }} className="h-7 w-2/3 rounded" />
        <div style={{ background: 'var(--color-surface-variant)' }} className="h-5 w-1/3 rounded" />
        <div style={{ background: 'var(--color-surface-variant)' }} className="h-4 w-full rounded" />
      </div>
    );
  }

  return (
    <div
      data-node-type="featuredSubscription"
      data-node-id={node.id}
      style={{ ...intentToStyleVars(node.intent), borderColor: 'var(--color-outline)' }}
      className="flex flex-col gap-3 p-8 border rounded-lg max-w-md"
    >
      <h3 style={typeRoleStyle('sub')}>{sub.name}</h3>
      <div style={{ ...typeRoleStyle('body'), opacity: 0.8 }}>
        {formatPriceCents(sub.priceCents)} / {sub.interval}
      </div>
      {sub.description !== undefined && (
        <p style={{ ...typeRoleStyle('caption'), opacity: 0.7 }}>{sub.description}</p>
      )}
      <a
        href={`/subscriptions#${sub.id}`}
        style={{
          ...typeRoleStyle('body'),
          background: 'var(--color-primary)',
          color: 'var(--color-on-primary)',
        }}
        className="mt-4 inline-flex items-center justify-center px-6 py-3 rounded-md"
      >
        Subscribe
      </a>
    </div>
  );
}
