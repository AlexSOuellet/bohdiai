import type { ButtonNode, ButtonVariant } from '@/lib/layout';
import type { RenderContext } from '../Node';
import { intentToStyleVars, typeRoleStyle } from '../intent';
import { joinClasses } from '../scale';

// Structural classes only — geometry and interaction, no color/size/weight.
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'inline-flex items-center justify-center px-6 py-3 rounded-md transition-colors',
  secondary:
    'inline-flex items-center justify-center px-6 py-3 rounded-md border transition-colors',
  ghost: 'inline-flex items-center justify-center px-4 py-2 rounded-md transition-colors hover:opacity-80',
  link: 'inline-flex items-center underline underline-offset-4 hover:opacity-80',
};

export function ButtonContent({
  node,
  ctx: _ctx,
}: {
  node: ButtonNode;
  ctx: RenderContext;
}) {
  const variant = node.variant ?? 'primary';

  // Colors come from semantic tokens so contrast is guaranteed. A primary button is the
  // brand primary with its paired on-color; outlined/text variants take the primary as
  // their ink (or a palette accent if the author set one) and the outline token for borders.
  const accent = node.intent?.palette !== undefined ? 'var(--node-palette)' : 'var(--color-primary)';
  const variantStyle = ((): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return { background: 'var(--color-primary)', color: 'var(--color-on-primary)' };
      case 'secondary':
        return { color: accent, borderColor: 'var(--color-outline)' };
      case 'ghost':
      case 'link':
        return { color: accent };
    }
  })();

  return (
    <a
      data-node-type="button"
      data-node-variant={variant}
      data-node-id={node.id}
      href={node.href}
      style={{ ...typeRoleStyle('body'), ...intentToStyleVars(node.intent), ...variantStyle }}
      className={joinClasses(VARIANT_CLASS[variant])}
    >
      {node.label}
    </a>
  );
}
