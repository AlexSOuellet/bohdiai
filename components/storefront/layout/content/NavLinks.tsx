import type { NavLinksNode, ResolvedNavLink } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars, typeRoleStyle } from '../intent';
import { joinClasses } from '../scale';

const STYLE_CLASS: Record<NonNullable<NavLinksNode['style']>, string> = {
  plain: '',
  underlined: 'underline underline-offset-4',
  pill: 'px-4 py-2 rounded-pill border border-current',
};

function resolvedNavLinksAt(ctx: RenderContext): ResolvedNavLink[] | null {
  if (ctx.resolved === undefined || ctx.path === undefined) return null;
  const data = ctx.resolved[ctx.path];
  if (!Array.isArray(data)) return null;
  return data as ResolvedNavLink[];
}

export function NavLinksContent({
  node,
  ctx,
}: {
  node: NavLinksNode;
  ctx: RenderContext;
}) {
  const resolved = resolvedNavLinksAt(ctx);

  const links: { slug: string; label: string }[] =
    resolved !== null && resolved.length > 0
      ? resolved.map((l) => ({ slug: l.slug, label: l.label }))
      : node.order === 'manual' && node.manualOrder !== undefined
        ? node.manualOrder.map((label) => ({
            slug: label.toLowerCase(),
            label,
          }))
        : [
            { slug: 'shop', label: 'Shop' },
            { slug: 'about', label: 'About' },
            { slug: 'contact', label: 'Contact' },
          ];

  const style = node.style ?? 'plain';

  // Links inherit the readable foreground of the surface they sit on (fixing the
  // default browser-blue link color). An explicit palette intent tints them an accent.
  const linkColor = node.intent?.palette !== undefined ? 'var(--node-palette)' : 'inherit';

  return (
    <nav
      data-node-type="navLinks"
      data-node-id={node.id}
      style={intentToStyleVars(node.intent)}
    >
      <ul className="flex flex-wrap items-center gap-4 md:gap-6">
        {links.map((l) => (
          <li key={l.slug}>
            <a
              href={`/${l.slug.replace(/^\/+/, '')}`}
              style={{ ...typeRoleStyle('body'), color: linkColor }}
              className={joinClasses(
                'hover:opacity-80 transition-opacity',
                STYLE_CLASS[style],
              )}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
