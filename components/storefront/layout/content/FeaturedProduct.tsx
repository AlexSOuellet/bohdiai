import type { FeaturedProductNode, ResolvedProduct } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';

function formatPriceCents(cents: number | undefined): string {
  if (cents === undefined) return '';
  return `$${(cents / 100).toFixed(2)}`;
}

function resolvedProductAt(ctx: RenderContext): ResolvedProduct | null {
  if (ctx.resolved === undefined || ctx.path === undefined) return null;
  const data = ctx.resolved[ctx.path];
  if (Array.isArray(data) || data === undefined || data === null) return null;
  return data as ResolvedProduct;
}

export function FeaturedProductContent({
  node,
  ctx,
}: {
  node: FeaturedProductNode;
  ctx: RenderContext;
}) {
  const product = resolvedProductAt(ctx);
  if (product === null) {
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
      </div>
    );
  }

  return (
    <a
      data-node-type="featuredProduct"
      data-node-id={node.id}
      data-product-id={product.id}
      href={`/listings/${product.slug}`}
      style={intentToStyleVars(node.intent)}
      className="flex flex-col gap-3 w-full max-w-md group"
    >
      <div className="aspect-[4/5] w-full bg-black/10 overflow-hidden">
        {product.imageUrl !== undefined && (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <div className="text-xl font-medium leading-snug">{product.name}</div>
      {node.showPrice !== false && product.priceCents !== undefined && (
        <div className="text-base opacity-80">
          {formatPriceCents(product.priceCents)}
        </div>
      )}
      {product.shortDescription !== undefined && (
        <p className="text-sm opacity-70 leading-relaxed">
          {product.shortDescription}
        </p>
      )}
      {node.showAddToCart !== false && (
        <span className="inline-flex items-center px-6 py-3 rounded-md bg-black text-white font-medium w-fit">
          Add to cart
        </span>
      )}
    </a>
  );
}
