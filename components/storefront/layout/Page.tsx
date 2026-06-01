import type { Page, ResolvedDataByNodePath } from '@/lib/layout';
import { Node, type RenderContext } from './Node';

export function LayoutPage({
  page,
  resolved,
}: {
  page: Page;
  resolved?: ResolvedDataByNodePath;
}) {
  const ctx: RenderContext = { path: 'root' };
  if (resolved !== undefined) ctx.resolved = resolved;
  return (
    <main
      data-page-slug={page.slug}
      data-page-name={page.name}
      className="w-full"
      style={{ background: 'var(--color-surface)', color: 'var(--color-on-surface)' }}
    >
      <Node node={page.root} ctx={ctx} />
    </main>
  );
}
