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

export function CartContent({
  node,
  ctx,
}: {
  node: CartNode;
  ctx: RenderContext;
}) {
  if (node.variant === 'icon') {
    return (
      <a
        data-node-type="cart"
        data-node-variant="icon"
        data-node-id={node.id}
        href="/cart"
        aria-label="Cart"
        style={intentToStyleVars(node.intent)}
        className="inline-flex items-center justify-center w-10 h-10 rounded-md hover:bg-black/5"
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
        className="flex flex-col gap-4 w-full"
      >
        <h2 className="text-2xl font-semibold">Your cart is empty</h2>
        <a
          href="/shop"
          className="inline-flex items-center w-fit px-6 py-3 rounded-md bg-black text-white font-medium"
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
      className="flex flex-col gap-4 w-full"
    >
      <h2 className="text-2xl font-semibold">Cart</h2>
      <div className="flex flex-col gap-3">
        {cart.lines.map((line) => (
          <div
            key={line.productId}
            className="flex items-center gap-4 py-3 border-b border-black/10"
          >
            <div className="w-16 h-16 bg-black/10 overflow-hidden">
              {line.imageUrl !== undefined && (
                <img
                  src={line.imageUrl}
                  alt={line.productName}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <div className="font-medium">{line.productName}</div>
              <div className="text-sm opacity-70">qty {line.quantity}</div>
            </div>
            <div className="text-base">{formatPriceCents(line.priceCents)}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="font-medium">Total</span>
        <span className="text-lg">{formatPriceCents(cart.subtotalCents)}</span>
      </div>
    </div>
  );
}
