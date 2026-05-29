import type { ButtonNode, ButtonVariant } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars } from '../intent';
import { joinClasses } from '../scale';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    'inline-flex items-center justify-center px-6 py-3 rounded-md font-medium transition-colors',
  secondary:
    'inline-flex items-center justify-center px-6 py-3 rounded-md border font-medium transition-colors',
  ghost:
    'inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors hover:opacity-80',
  link: 'inline-flex items-center underline underline-offset-4 font-medium hover:opacity-80',
};

export function ButtonContent({
  node,
  ctx: _ctx,
}: {
  node: ButtonNode;
  ctx: RenderContext;
}) {
  const variant = node.variant ?? 'primary';
  const variantStyle = (() => {
    if (variant === 'primary') {
      return node.intent?.palette
        ? { background: 'var(--node-palette)', color: 'white' }
        : undefined;
    }
    if (variant === 'secondary' || variant === 'ghost' || variant === 'link') {
      return node.intent?.palette ? { color: 'var(--node-palette)' } : undefined;
    }
    return undefined;
  })();

  return (
    <a
      data-node-type="button"
      data-node-variant={variant}
      data-node-id={node.id}
      href={node.href}
      style={{ ...intentToStyleVars(node.intent), ...variantStyle }}
      className={joinClasses(VARIANT_CLASS[variant])}
    >
      {node.label}
    </a>
  );
}
