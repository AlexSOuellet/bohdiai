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
  return (
    <Tag
      data-node-type="text"
      data-node-role={node.role}
      data-node-id={node.id}
      style={{
        ...intentToStyleVars(node.intent),
        ...(node.intent?.palette ? { color: 'var(--node-palette)' } : null),
      }}
      className={joinClasses(
        ROLE_CLASS[node.role],
        node.align && ALIGN_CLASS[node.align],
      )}
    >
      {node.content}
    </Tag>
  );
}
