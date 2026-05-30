import type { TextAlign, TextNode, TextRole } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';
import { joinClasses } from '../scale';

const ROLE_CLASS: Record<TextRole, string> = {
  eyebrow: 'text-xs uppercase tracking-[0.2em] font-medium opacity-80',
  headline: 'text-4xl md:text-6xl font-semibold leading-[1.05] tracking-tight',
  sub: 'text-xl md:text-2xl font-medium leading-snug',
  body: 'text-base md:text-lg leading-relaxed',
  caption: 'text-sm opacity-70',
};

// Mobile (base) role class — desktop sizes get scoped under md: prefix so they win.
const MOBILE_ROLE_CLASS: Record<TextRole, string> = {
  eyebrow: 'text-[0.65rem] uppercase tracking-[0.18em] font-medium opacity-80',
  headline: 'text-3xl font-semibold leading-[1.1] tracking-tight',
  sub: 'text-lg font-medium leading-snug',
  body: 'text-sm leading-relaxed',
  caption: 'text-xs opacity-70',
};

const DESKTOP_ROLE_CLASS_MD: Record<TextRole, string> = {
  eyebrow: 'md:text-xs md:tracking-[0.2em]',
  headline: 'md:text-6xl md:leading-[1.05]',
  sub: 'md:text-2xl',
  body: 'md:text-lg',
  caption: 'md:text-sm',
};

const MOBILE_STEP_DOWN: Record<TextRole, TextRole> = {
  eyebrow: 'eyebrow',
  headline: 'sub',
  sub: 'body',
  body: 'caption',
  caption: 'caption',
};

const ALIGN_CLASS: Record<TextAlign, string> = {
  start: 'text-left',
  center: 'text-center',
  end: 'text-right',
};

const ROLE_TAG: Record<TextRole, 'p' | 'h1' | 'h2' | 'h3' | 'span'> = {
  eyebrow: 'span',
  headline: 'h1',
  sub: 'h2',
  body: 'p',
  caption: 'span',
};

export function TextContent({
  node,
  ctx: _ctx,
}: {
  node: TextNode;
  ctx: RenderContext;
}) {
  const Tag = ROLE_TAG[node.role];
  const desktopRole = node.role;
  const mobileRole = node.mobile?.role ?? MOBILE_STEP_DOWN[desktopRole];
  const className = node.mobile?.role !== undefined || desktopRole !== mobileRole
    ? joinClasses(
        MOBILE_ROLE_CLASS[mobileRole],
        DESKTOP_ROLE_CLASS_MD[desktopRole],
        node.align && ALIGN_CLASS[node.align],
      )
    : joinClasses(
        ROLE_CLASS[desktopRole],
        node.align && ALIGN_CLASS[node.align],
      );
  return (
    <Tag
      data-node-type="text"
      data-node-role={desktopRole}
      data-node-role-mobile={mobileRole}
      data-node-id={node.id}
      style={{
        ...intentToStyleVars(node.intent),
        ...(node.intent?.palette ? { color: 'var(--node-palette)' } : null),
      }}
      className={className}
    >
      {node.content}
    </Tag>
  );
}
