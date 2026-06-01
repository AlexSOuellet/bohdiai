import type { QuoteNode } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars, typeRoleStyle } from '../intent';

export function QuoteContent({ node, ctx: _ctx }: { node: QuoteNode; ctx: RenderContext }) {
  return (
    <figure
      data-node-type="quote"
      data-node-id={node.id}
      style={{
        ...intentToStyleVars(node.intent),
        ...(node.intent?.palette ? { color: 'var(--node-palette)' } : null),
      }}
      className="max-w-2xl"
    >
      <blockquote style={{ ...typeRoleStyle('sub'), fontStyle: 'italic' }}>
        &ldquo;{node.body}&rdquo;
      </blockquote>
      {(node.attribution !== undefined || node.role !== undefined) && (
        <figcaption style={{ ...typeRoleStyle('caption'), opacity: 0.7 }} className="mt-3">
          {node.attribution !== undefined && (
            <span className="not-italic">{node.attribution}</span>
          )}
          {node.attribution !== undefined && node.role !== undefined && <span>, </span>}
          {node.role !== undefined && <span>{node.role}</span>}
        </figcaption>
      )}
    </figure>
  );
}
