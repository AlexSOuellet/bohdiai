import type { NavLinksNode } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';
import { joinClasses } from '../scale';

const STYLE_CLASS: Record<NonNullable<NavLinksNode['style']>, string> = {
  plain: '',
  underlined: 'underline underline-offset-4',
  pill: 'px-4 py-2 rounded-pill border border-current',
};

export function NavLinksContent({
  node,
  ctx: _ctx,
}: {
  node: NavLinksNode;
  ctx: RenderContext;
}) {
  const placeholderLinks =
    node.order === 'manual' && node.manualOrder !== undefined
      ? node.manualOrder
      : ['Shop', 'About', 'Contact'];
  const style = node.style ?? 'plain';

  return (
    <nav
      data-node-type="navLinks"
      data-node-id={node.id}
      data-bound-placeholder
      style={intentToStyleVars(node.intent)}
    >
      <ul className="flex flex-wrap items-center gap-4 md:gap-6">
        {placeholderLinks.map((label) => (
          <li key={label}>
            <a
              href={`/${label.toLowerCase()}`}
              className={joinClasses(
                'text-sm md:text-base font-medium hover:opacity-80 transition-opacity',
                STYLE_CLASS[style],
              )}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
