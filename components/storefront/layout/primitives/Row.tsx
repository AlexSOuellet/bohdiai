import type { RowNode } from '@/lib/layout';
import { Node, deriveCtx, type RenderContext } from '../Node';
import { applyDensity, intentToStyleVars } from '../intent';
import {
  ALIGN_ITEMS_WITH_BASELINE_CLASS,
  ALIGN_ITEMS_WITH_BASELINE_CLASS_MD,
  GAP_CLASS,
  GAP_CLASS_MD,
  JUSTIFY_CONTENT_CLASS,
  JUSTIFY_CONTENT_CLASS_MD,
  joinClasses,
} from '../scale';

export function Row({ node, ctx }: { node: RowNode; ctx: RenderContext }) {
  const childCtx = deriveCtx(node, ctx);
  const desktopGap = applyDensity(node.gap, ctx.density) ?? 'md';
  const mobileGap = applyDensity(node.mobile?.gap, ctx.density) ?? desktopGap;
  const desktopAlign = node.align;
  const mobileAlign = node.mobile?.align ?? desktopAlign;
  const desktopJustify = node.justify;
  const mobileJustify = node.mobile?.justify ?? desktopJustify;
  const collapse = node.mobile?.collapse ?? 'wrap';
  const desktopWrap = node.wrap === true;

  const directionMobile =
    collapse === 'stack' ? 'flex-col' : 'flex-row';
  const directionDesktop = 'md:flex-row';
  const wrapMobile =
    collapse === 'wrap' ? 'flex-wrap' : 'flex-nowrap';
  const wrapDesktop = desktopWrap ? 'md:flex-wrap' : 'md:flex-nowrap';

  return (
    <div
      data-node-type="row"
      data-node-id={node.id}
      style={intentToStyleVars(node.intent)}
      className={joinClasses(
        'flex',
        directionMobile,
        directionDesktop,
        wrapMobile,
        wrapDesktop,
        GAP_CLASS[mobileGap],
        GAP_CLASS_MD[desktopGap],
        mobileAlign && ALIGN_ITEMS_WITH_BASELINE_CLASS[mobileAlign],
        desktopAlign && ALIGN_ITEMS_WITH_BASELINE_CLASS_MD[desktopAlign],
        mobileJustify && JUSTIFY_CONTENT_CLASS[mobileJustify],
        desktopJustify && JUSTIFY_CONTENT_CLASS_MD[desktopJustify],
      )}
    >
      {node.children.map((child, i) => (
        <Node key={child.id ?? `row-${i}`} node={child} ctx={childCtx} />
      ))}
    </div>
  );
}
