import type { CSSProperties } from 'react';
import type { OverlapAnchorPosition, OverlapNode } from '@/lib/layout';
import { Node, childPath, deriveCtx, type RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';
import { joinClasses } from '../scale';

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
        return (
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
