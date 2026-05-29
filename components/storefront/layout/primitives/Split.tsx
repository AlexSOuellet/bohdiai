import type { CSSProperties } from 'react';
import type { SplitNode } from '@/lib/layout';
import { Node, deriveCtx, type RenderContext } from '../Node';
import { applyDensity, intentToStyleVars } from '../intent';
import { GAP_CLASS, GAP_CLASS_MD, joinClasses } from '../scale';

export function Split({ node, ctx }: { node: SplitNode; ctx: RenderContext }) {
  const childCtx = deriveCtx(node, ctx);
  const desktopGap = applyDensity(node.gap, ctx.density) ?? 'md';
  const mobileGap = applyDensity(node.mobile?.gap, ctx.density) ?? desktopGap;
  const desktopDirection = node.direction;
  const mobileDirection = node.mobile?.direction ?? 'vertical';

  const ratiosStr = node.ratios.map((r) => `${r}fr`).join(' ');
  const desktopStyle: CSSProperties =
    desktopDirection === 'horizontal'
      ? { gridTemplateColumns: ratiosStr }
      : { gridTemplateRows: ratiosStr };

  const mobileFlexDirection = mobileDirection === 'horizontal' ? 'flex-row' : 'flex-col';

  const stackOrder = node.mobile?.stackOrder;

  return (
    <div
      data-node-type="split"
      data-node-id={node.id}
      style={{
        ...intentToStyleVars(node.intent),
        ...desktopStyle,
      }}
      className={joinClasses(
        'flex md:grid',
        mobileFlexDirection,
        GAP_CLASS[mobileGap],
        GAP_CLASS_MD[desktopGap],
      )}
    >
      {node.children.map((child, i) => {
        const wrapperStyle: CSSProperties =
          stackOrder !== undefined
            ? { order: stackOrder.indexOf(i) }
            : {};
        return (
          <div
            key={child.id ?? `split-${i}`}
            style={wrapperStyle}
            className="flex flex-col"
          >
            <Node node={child} ctx={childCtx} />
          </div>
        );
      })}
    </div>
  );
}
