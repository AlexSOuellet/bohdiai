import NextImage from 'next/image';
import type { WordmarkNode } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';

export function WordmarkContent({ node, ctx: _ctx }: { node: WordmarkNode; ctx: RenderContext }) {
  const href = node.href ?? '/';

  const inner =
    node.kind === 'text' ? (
      <span
        style={{
          ...intentToStyleVars(node.intent),
          ...(node.intent?.palette ? { color: 'var(--node-palette)' } : null),
        }}
        className="text-2xl font-semibold tracking-tight md:text-3xl"
      >
        {node.content}
      </span>
    ) : (
      <NextImage
        src={node.content}
        alt="Logo"
        width={200}
        height={60}
        style={{ height: 'auto', width: 'auto', maxHeight: '60px' }}
      />
    );

  return (
    <a
      data-node-type="wordmark"
      data-node-kind={node.kind}
      data-node-id={node.id}
      href={href}
      className="inline-flex items-center"
    >
      {inner}
    </a>
  );
}
