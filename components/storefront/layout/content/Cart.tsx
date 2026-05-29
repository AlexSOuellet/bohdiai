import type { CartNode } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';

export function CartContent({
  node,
  ctx: _ctx,
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

  return (
    <div
      data-node-type="cart"
      data-node-variant="page"
      data-node-id={node.id}
      data-bound-placeholder
      style={intentToStyleVars(node.intent)}
      className="flex flex-col gap-4 w-full"
    >
      <div className="h-6 w-1/4 bg-black/10 rounded" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={`cart-line-${i}`} className="flex items-center gap-4 py-3 border-b border-black/10">
            <div className="w-16 h-16 bg-black/10" />
            <div className="flex-1 flex flex-col gap-1">
              <div className="h-4 w-1/2 bg-black/10 rounded" />
              <div className="h-3 w-1/4 bg-black/10 rounded" />
            </div>
            <div className="h-5 w-16 bg-black/10 rounded" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="font-medium">Total</span>
        <div className="h-5 w-20 bg-black/10 rounded" />
      </div>
    </div>
  );
}
