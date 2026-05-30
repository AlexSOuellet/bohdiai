import type { CSSProperties } from 'react';
import type {
  LayoutNode,
  OverlapAnchorPosition,
  OverlapNode,
  OverlapScrim,
} from '@/lib/layout';
import { Node, childPath, deriveCtx, type RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';
import { joinClasses } from '../scale';

const TEXTUAL_NODE_TYPES = new Set(['text', 'button', 'wordmark', 'quote']);

function firstChildIsImage(node: LayoutNode): boolean {
  if (
    node.type === 'band' ||
    node.type === 'stack' ||
    node.type === 'row' ||
    node.type === 'split' ||
    node.type === 'grid' ||
    node.type === 'marquee' ||
    node.type === 'overlap'
  ) {
    const first = node.children[0];
    if (first === undefined) return false;
    if (first.type === 'image') return true;
    return firstChildIsImage(first);
  }
  if (node.type === 'bleed' || node.type === 'pane') {
    if (node.child.type === 'image') return true;
    return firstChildIsImage(node.child);
  }
  return node.type === 'image';
}

function hasOverlayText(node: LayoutNode): boolean {
  if (TEXTUAL_NODE_TYPES.has(node.type)) return true;
  if (
    node.type === 'band' ||
    node.type === 'stack' ||
    node.type === 'row' ||
    node.type === 'split' ||
    node.type === 'grid' ||
    node.type === 'marquee' ||
    node.type === 'overlap'
  ) {
    return node.children.some((c) => hasOverlayText(c));
  }
  if (node.type === 'bleed' || node.type === 'pane') {
    return hasOverlayText(node.child);
  }
  return false;
}

function resolveScrim(
  node: OverlapNode,
): 'none' | 'light' | 'dark' {
  const explicit: OverlapScrim = node.scrim ?? 'auto';
  if (explicit === 'none') return 'none';
  if (explicit === 'light' || explicit === 'dark') return explicit;
  // auto
  const base = node.children[node.anchor];
  if (base === undefined) return 'none';
  if (!firstChildIsImage(base)) return 'none';
  const layered = node.children.filter((_, i) => i !== node.anchor);
  if (!layered.some((c) => hasOverlayText(c))) return 'none';
  // choose by intent palette on layered text — if any layered node has a palette intent, default dark
  return 'dark';
}

const SCRIM_CLASS: Record<'light' | 'dark', string> = {
  light:
    'absolute inset-0 pointer-events-none bg-gradient-to-t from-white/70 via-white/30 to-transparent',
  dark:
    'absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-black/20 to-transparent',
};

const POSITION_CLASS: Record<OverlapAnchorPosition, string> = {
  'top-left': 'top-0 left-0',
  top: 'top-0 left-1/2 -translate-x-1/2',
  'top-right': 'top-0 right-0',
  left: 'top-1/2 left-0 -translate-y-1/2',
  center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  right: 'top-1/2 right-0 -translate-y-1/2',
  'bottom-left': 'bottom-0 left-0',
  bottom: 'bottom-0 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-0 right-0',
};

export function Overlap({ node, ctx }: { node: OverlapNode; ctx: RenderContext }) {
  const childCtx = deriveCtx(node, ctx);
  const align = node.align ?? 'center';
  const collapse = node.mobile?.collapse ?? 'preserve';
  const stackOrder = node.mobile?.stackOrder;
  const anchorIndex = node.anchor;

  const scrim = resolveScrim(node);

  const layered = (
    <div
      className="relative w-full h-full"
      style={{ minHeight: 'inherit' }}
    >
      {node.children.map((child, i) => {
        const isAnchor = i === anchorIndex;
        const positionClass = isAnchor
          ? 'relative w-full h-full'
          : joinClasses('absolute', POSITION_CLASS[align]);
        const anchorNode = (
          <div
            key={child.id ?? `overlap-${i}`}
            className={positionClass}
            style={isAnchor ? { zIndex: 0 } : { zIndex: i + 1 }}
          >
            <Node
              node={child}
              ctx={{ ...childCtx, path: childPath(ctx, `children[${i}]`) }}
            />
          </div>
        );
        if (isAnchor && scrim !== 'none') {
          return (
            <div key={child.id ?? `overlap-${i}`} className="relative w-full h-full" style={{ zIndex: 0 }}>
              <Node
                node={child}
                ctx={{ ...childCtx, path: childPath(ctx, `children[${i}]`) }}
              />
              <div data-scrim={scrim} className={SCRIM_CLASS[scrim]} />
            </div>
          );
        }
        return anchorNode;
      })}
    </div>
  );

  const stacked = (
    <div className="flex flex-col w-full">
      {node.children.map((child, i) => {
        const wrapperStyle: CSSProperties = stackOrder
          ? { order: stackOrder.indexOf(i) }
          : {};
        return (
          <div
            key={child.id ?? `overlap-stack-${i}`}
            style={wrapperStyle}
            className="w-full"
          >
            <Node
              node={child}
              ctx={{ ...childCtx, path: childPath(ctx, `children[${i}]`) }}
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      data-node-type="overlap"
      data-node-id={node.id}
      style={intentToStyleVars(node.intent)}
      className="relative w-full"
    >
      <div className={collapse === 'preserve' ? 'block' : 'block md:hidden'}>
        {collapse === 'preserve' ? layered : stacked}
      </div>
      {collapse === 'stack' ? (
        <div className="hidden md:block">{layered}</div>
      ) : null}
    </div>
  );
}
