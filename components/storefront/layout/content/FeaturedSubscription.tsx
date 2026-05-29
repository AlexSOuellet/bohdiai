import type { FeaturedSubscriptionNode } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';

export function FeaturedSubscriptionContent({
  node,
  ctx: _ctx,
}: {
  node: FeaturedSubscriptionNode;
  ctx: RenderContext;
}) {
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
      <div className="h-4 w-5/6 bg-black/10 rounded" />
      <div className="h-11 w-full bg-black/10 rounded mt-4" />
    </div>
  );
}
