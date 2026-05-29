import type { GutterNode } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';
import {
  GUTTER_HORIZONTAL_CLASS,
  GUTTER_HORIZONTAL_CLASS_MD,
  GUTTER_VERTICAL_CLASS,
  GUTTER_VERTICAL_CLASS_MD,
  joinClasses,
} from '../scale';

export function Gutter({ node, ctx: _ctx }: { node: GutterNode; ctx: RenderContext }) {
  const axis = node.axis ?? 'vertical';
  const desktopSize = node.size;
  const mobileSize = node.mobile?.size ?? desktopSize;

  const sizeClass =
    axis === 'vertical'
      ? joinClasses(
          'w-full',
          GUTTER_VERTICAL_CLASS[mobileSize],
          GUTTER_VERTICAL_CLASS_MD[desktopSize],
        )
      : joinClasses(
          'h-full',
          GUTTER_HORIZONTAL_CLASS[mobileSize],
          GUTTER_HORIZONTAL_CLASS_MD[desktopSize],
        );

  return (
    <div
      data-node-type="gutter"
      data-node-id={node.id}
      aria-hidden="true"
      style={intentToStyleVars(node.intent)}
      className={sizeClass}
    />
  );
}
