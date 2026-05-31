import type { GridNode } from '@/lib/layout';
import { Node, childPath, deriveCtx, type RenderContext } from '../Node';
import { applyDensity, intentToStyleVars } from '../intent';
import {
  ALIGN_CONTENT_CLASS,
  ALIGN_CONTENT_CLASS_MD,
  ALIGN_ITEMS_CLASS,
  ALIGN_ITEMS_CLASS_MD,
  GAP_X_CLASS,
  GAP_X_CLASS_MD,
  GAP_Y_CLASS,
  GAP_Y_CLASS_MD,
  GRID_COLS_CLASS,
  GRID_COLS_CLASS_MD,
  GRID_ROWS_CLASS,
  defaultMobileColumnsForDesktop,
  joinClasses,
} from '../scale';

export function Grid({ node, ctx }: { node: GridNode; ctx: RenderContext }) {
  const childCtx = deriveCtx(node, ctx);
  const desktopGapX = applyDensity(node.gapX, ctx.density) ?? 'md';
  const desktopGapY = applyDensity(node.gapY, ctx.density) ?? 'md';
  const mobileGapX = applyDensity(node.mobile?.gapX, ctx.density) ?? desktopGapX;
  const mobileGapY = applyDensity(node.mobile?.gapY, ctx.density) ?? desktopGapY;
  const desktopColumns = node.columns;
  const mobileColumns = node.mobile?.columns ?? defaultMobileColumnsForDesktop(desktopColumns);
  const desktopAlign = node.align;
  const mobileAlign = desktopAlign;
  const desktopJustify = node.justify;
  const mobileJustify = desktopJustify;

  return (
    <div
      data-node-type="grid"
      data-node-id={node.id}
      style={intentToStyleVars(node.intent)}
      className={joinClasses(
        'grid',
        GRID_COLS_CLASS[mobileColumns] ?? GRID_COLS_CLASS[1],
        GRID_COLS_CLASS_MD[desktopColumns] ?? GRID_COLS_CLASS_MD[1],
        node.rows !== undefined ? (GRID_ROWS_CLASS[node.rows] ?? '') : '',
        GAP_X_CLASS[mobileGapX],
        GAP_X_CLASS_MD[desktopGapX],
        GAP_Y_CLASS[mobileGapY],
        GAP_Y_CLASS_MD[desktopGapY],
        mobileAlign && ALIGN_ITEMS_CLASS[mobileAlign],
        desktopAlign && ALIGN_ITEMS_CLASS_MD[desktopAlign],
        mobileJustify && ALIGN_CONTENT_CLASS[mobileJustify],
        desktopJustify && ALIGN_CONTENT_CLASS_MD[desktopJustify],
      )}
    >
      {node.children.map((child, i) => (
        <Node
          key={child.id ?? `grid-${i}`}
          node={child}
          ctx={{ ...childCtx, path: childPath(ctx, `children[${i}]`) }}
        />
      ))}
    </div>
  );
}
