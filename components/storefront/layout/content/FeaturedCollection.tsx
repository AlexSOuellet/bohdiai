import type { FeaturedCollectionNode } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';

export function FeaturedCollectionContent({
  node,
  ctx: _ctx,
}: {
  node: FeaturedCollectionNode;
  ctx: RenderContext;
}) {
  const preview = node.previewCount ?? 4;
  return (
    <div
      data-node-type="featuredCollection"
      data-node-id={node.id}
      data-bound-placeholder
      data-collection-slug={node.collectionSlug}
      style={intentToStyleVars(node.intent)}
      className="flex flex-col gap-4 w-full"
    >
      <div className="h-7 w-1/3 bg-black/10 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: preview }).map((_, i) => (
          <div key={`featured-collection-${i}`} className="aspect-square w-full bg-black/10" />
        ))}
      </div>
    </div>
  );
}
