import type { StackNode } from '@/lib/layout';
import { Node, childPath, deriveCtx, type RenderContext } from '../Node';
import { applyDensity, intentToStyleVars } from '../intent';
import {
  ALIGN_ITEMS_CLASS,
  ALIGN_ITEMS_CLASS_MD,
  GAP_CLASS,
  GAP_CLASS_MD,
  JUSTIFY_CONTENT_CLASS,
  JUSTIFY_CONTENT_CLASS_MD,
  joinClasses,
} from '../scale';

export function Stack({ node, ctx }: { node: StackNode; ctx: RenderContext }) {
  const childCtx = deriveCtx(node, ctx);
  const desktopGap = applyDensity(node.gap, ctx.density) ?? 'md';
  const mobileGap = applyDensity(node.mobile?.gap, ctx.density) ?? desktopGap;
  const desktopAlign = node.align;
  const mobileAlign = node.mobile?.align ?? desktopAlign;
  const desktopJustify = node.justify;
  const mobileJustify = node.mobile?.justify ?? desktopJustify;

  return (
    <div
      data-node-type="stack"
      data-node-id={node.id}
      style={intentToStyleVars(node.intent)}
      className={joinClasses(
        'flex flex-col',
        GAP_CLASS[mobileGap],
        GAP_CLASS_MD[desktopGap],
        mobileAlign && ALIGN_ITEMS_CLASS[mobileAlign],
        desktopAlign && ALIGN_ITEMS_CLASS_MD[desktopAlign],
        mobileJustify && JUSTIFY_CONTENT_CLASS[mobileJustify],
        desktopJustify && JUSTIFY_CONTENT_CLASS_MD[desktopJustify],
      )}
    >
      {node.children.map((child, i) => (
        <Node
          key={child.id ?? `stack-${i}`}
          node={child}
          ctx={{ ...childCtx, path: childPath(ctx, `children[${i}]`) }}
        />
      ))}
    </div>
  );
}
