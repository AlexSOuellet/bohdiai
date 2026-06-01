import NextImage from 'next/image';
import type { WordmarkNode } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars, paletteVar, typeRoleStyle } from '../intent';

function gradientStyle(gradient: NonNullable<WordmarkNode['gradient']>): React.CSSProperties {
  const angle = gradient.angle ?? 90;
  return {
    backgroundImage: `linear-gradient(${angle}deg, ${paletteVar(gradient.from)}, ${paletteVar(gradient.to)})`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  };
}

export function WordmarkContent({ node, ctx: _ctx }: { node: WordmarkNode; ctx: RenderContext }) {
  const href = node.href ?? '/';

  // Color precedence: an explicit gradient wins, then a palette accent, otherwise the
  // wordmark inherits the readable text color of whatever surface it sits on.
  const colorStyle: React.CSSProperties = node.gradient
    ? gradientStyle(node.gradient)
    : node.intent?.palette
      ? { color: 'var(--node-palette)' }
      : {};

  const inner =
    node.kind === 'text' ? (
      <span
        style={{
          ...typeRoleStyle('wordmark'),
          ...intentToStyleVars(node.intent),
          ...colorStyle,
        }}
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
