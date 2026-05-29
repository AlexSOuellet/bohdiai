import type { FeaturedProductNode } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';

export function FeaturedProductContent({
  node,
  ctx: _ctx,
}: {
  node: FeaturedProductNode;
  ctx: RenderContext;
}) {
  return (
    <div
      data-node-type="featuredProduct"
      data-node-id={node.id}
      data-bound-placeholder
      data-product-id={node.productId}
      style={intentToStyleVars(node.intent)}
      className="flex flex-col gap-3 w-full max-w-md"
    >
      <div className="aspect-[4/5] w-full bg-black/10" />
      <div className="h-5 w-2/3 bg-black/10 rounded" />
      <div className="h-4 w-1/4 bg-black/10 rounded" />
      {node.showAddToCart !== false && (
        <div className="h-10 w-32 bg-black/10 rounded" />
      )}
    </div>
  );
}
