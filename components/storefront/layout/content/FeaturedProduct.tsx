import Image from 'next/image';
import type { FeaturedProductNode, ResolvedProduct } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars, typeRoleStyle } from '../intent';

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
        <div
          style={{ background: 'var(--color-surface-variant)' }}
          className="aspect-[4/5] w-full"
        />
        <div style={{ background: 'var(--color-surface-variant)' }} className="h-5 w-2/3 rounded" />
        <div style={{ background: 'var(--color-surface-variant)' }} className="h-4 w-1/4 rounded" />
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
      <div
        style={{ background: 'var(--color-surface-variant)' }}
        className="relative aspect-[4/5] w-full overflow-hidden"
      >
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
      <div style={typeRoleStyle('sub')}>{product.name}</div>
      {node.showPrice !== false && product.priceCents !== undefined && (
        <div style={{ ...typeRoleStyle('body'), opacity: 0.8 }}>
          {formatPriceCents(product.priceCents)}
        </div>
      )}
      {product.shortDescription !== undefined && (
        <p style={{ ...typeRoleStyle('caption'), opacity: 0.7 }}>{product.shortDescription}</p>
      )}
      {node.showAddToCart !== false && (
        <span
          style={{
            ...typeRoleStyle('body'),
            background: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
          }}
          className="inline-flex w-fit items-center rounded-md px-6 py-3"
        >
          Add to cart
        </span>
      )}
    </a>
  );
}
