import type { SubscriptionGridNode } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';
import {
  GAP_X_CLASS,
  GAP_X_CLASS_MD,
  GAP_Y_CLASS,
  GAP_Y_CLASS_MD,
  GRID_COLS_CLASS,
  GRID_COLS_CLASS_MD,
  joinClasses,
} from '../scale';

export function SubscriptionGridContent({
  node,
  ctx: _ctx,
}: {
  node: SubscriptionGridNode;
  ctx: RenderContext;
}) {
  const count = node.count ?? 3;
  const desktopColumns = node.columns ?? 3;
  const mobileColumns = node.mobileColumns ?? 1;

  return (
    <div
      data-node-type="subscriptionGrid"
      data-node-id={node.id}
      data-bound-placeholder
      style={intentToStyleVars(node.intent)}
      className={joinClasses(
        'grid w-full',
        GRID_COLS_CLASS[mobileColumns] ?? GRID_COLS_CLASS[1],
        GRID_COLS_CLASS_MD[desktopColumns] ?? GRID_COLS_CLASS_MD[3],
        GAP_X_CLASS.md,
        GAP_X_CLASS_MD.md,
        GAP_Y_CLASS.md,
        GAP_Y_CLASS_MD.md,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={`subscription-${i}`} className="flex flex-col gap-3 p-6 border border-black/10 rounded-lg">
          <div className="h-6 w-2/3 bg-black/10 rounded" />
          <div className="h-4 w-1/3 bg-black/10 rounded" />
          <div className="h-3 w-full bg-black/10 rounded" />
          <div className="h-3 w-5/6 bg-black/10 rounded" />
          <div className="h-10 w-full bg-black/10 rounded mt-3" />
        </div>
      ))}
    </div>
  );
}
