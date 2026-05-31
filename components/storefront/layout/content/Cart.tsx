import Image from 'next/image';
import type { CartNode, ResolvedCart } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';

function formatPriceCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function resolvedCartAt(ctx: RenderContext): ResolvedCart | null {
  if (ctx.resolved === undefined || ctx.path === undefined) return null;
  const data = ctx.resolved[ctx.path];
  if (Array.isArray(data) || data === undefined || data === null) return null;
  return data as ResolvedCart;
}

export function CartContent({ node, ctx }: { node: CartNode; ctx: RenderContext }) {
  if (node.variant === 'icon') {
    return (
      <a
        data-node-type="cart"
        data-node-variant="icon"
        data-node-id={node.id}
        href="/cart"
        aria-label="Cart"
        style={intentToStyleVars(node.intent)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-black/5"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
        </svg>
      </a>
    );
  }

  const cart = resolvedCartAt(ctx);

  if (cart === null || cart.lines.length === 0) {
    return (
      <div
        data-node-type="cart"
        data-node-variant="page"
        data-node-id={node.id}
        style={intentToStyleVars(node.intent)}
        className="flex w-full flex-col gap-4"
      >
        <h2 className="text-2xl font-semibold">Your cart is empty</h2>
        <a
          href="/shop"
          className="inline-flex w-fit items-center rounded-md bg-black px-6 py-3 font-medium text-white"
        >
          Browse the shop
        </a>
      </div>
    );
  }

  return (
    <div
      data-node-type="cart"
      data-node-variant="page"
      data-node-id={node.id}
      style={intentToStyleVars(node.intent)}
      className="flex w-full flex-col gap-4"
    >
      <h2 className="text-2xl font-semibold">Cart</h2>
      <div className="flex flex-col gap-3">
        {cart.lines.map((line) => (
          <div
            key={line.productId}
            className="flex items-center gap-4 border-b border-black/10 py-3"
          >
            <div className="relative h-16 w-16 overflow-hidden bg-black/10">
              {line.imageUrl !== undefined && (
                <Image
                  src={line.imageUrl}
                  alt={line.productName}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <div className="font-medium">{line.productName}</div>
              <div className="text-sm opacity-70">qty {line.quantity}</div>
            </div>
            <div className="text-base">{formatPriceCents(line.priceCents)}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-medium">Total</span>
        <span className="text-lg">{formatPriceCents(cart.subtotalCents)}</span>
      </div>
    </div>
  );
}
