import type { TextAlign, TextNode, TextRole } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';
import { joinClasses } from '../scale';

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

export function TextContent({ node, ctx: _ctx }: { node: TextNode; ctx: RenderContext }) {
  const Tag = ROLE_TAG[node.role];
  const role = node.role;

  // Type scale values come entirely from CSS variables set by the compiled design system.
  // The mobile size is the default; the @media (min-width: 768px) block overrides it.
  const typeStyle: React.CSSProperties = {
    fontFamily: `var(--type-${role}-font)`,
    fontSize: `var(--type-${role}-size)`,
    fontWeight: `var(--type-${role}-weight)` as React.CSSProperties['fontWeight'],
    lineHeight: `var(--type-${role}-line-height)`,
    letterSpacing: `var(--type-${role}-letter-spacing, normal)`,
    textTransform: `var(--type-${role}-transform, none)` as React.CSSProperties['textTransform'],
  };

  return (
    <Tag
      data-node-type="text"
      data-node-role={role}
      data-node-id={node.id}
      style={{
        ...typeStyle,
        ...intentToStyleVars(node.intent),
        ...(node.intent?.palette ? { color: 'var(--node-palette)' } : null),
      }}
      className={joinClasses(node.align && ALIGN_CLASS[node.align])}
    >
      {node.content}
    </Tag>
  );
}
