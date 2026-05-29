import type { CollectionGridNode } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';
import {
  GAP_X_CLASS,
  GAP_X_CLASS_MD,
  GAP_Y_CLASS,
  GAP_Y_CLASS_MD,
  GRID_COLS_CLASS,
  GRID_COLS_CLASS_MD,
  defaultMobileColumnsForDesktop,
  joinClasses,
} from '../scale';

export function CollectionGridContent({
  node,
  ctx: _ctx,
}: {
  node: CollectionGridNode;
  ctx: RenderContext;
}) {
  const count = node.count ?? 3;
  const desktopColumns = node.columns ?? 3;
  const mobileColumns =
    node.mobileColumns ?? defaultMobileColumnsForDesktop(desktopColumns);

  return (
    <div
      data-node-type="collectionGrid"
      data-node-id={node.id}
      data-bound-placeholder
      style={intentToStyleVars(node.intent)}
      className={joinClasses(
        'grid w-full',
        GRID_COLS_CLASS[mobileColumns] ?? GRID_COLS_CLASS[1],
        GRID_COLS_CLASS_MD[desktopColumns] ?? GRID_COLS_CLASS_MD[3],
        GAP_X_CLASS.sm,
        GAP_X_CLASS_MD.md,
        GAP_Y_CLASS.md,
        GAP_Y_CLASS_MD.lg,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={`collection-${i}`} className="flex flex-col gap-2">
          <div className="aspect-[3/2] w-full bg-black/10" />
          <div className="h-5 w-1/2 bg-black/10 rounded" />
        </div>
      ))}
    </div>
  );
}
