import Image from 'next/image';
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
        className="flex w-full max-w-md flex-col gap-3"
      >
        <div className="aspect-[4/5] w-full bg-black/10" />
        <div className="h-5 w-2/3 rounded bg-black/10" />
        <div className="h-4 w-1/4 rounded bg-black/10" />
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
      className="group flex w-full max-w-md flex-col gap-3"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/10">
        {product.imageUrl !== undefined && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <div className="text-xl font-medium leading-snug">{product.name}</div>
      {node.showPrice !== false && product.priceCents !== undefined && (
        <div className="text-base opacity-80">{formatPriceCents(product.priceCents)}</div>
      )}
      {product.shortDescription !== undefined && (
        <p className="text-sm leading-relaxed opacity-70">{product.shortDescription}</p>
      )}
      {node.showAddToCart !== false && (
        <span className="inline-flex w-fit items-center rounded-md bg-black px-6 py-3 font-medium text-white">
          Add to cart
        </span>
      )}
    </a>
  );
}
