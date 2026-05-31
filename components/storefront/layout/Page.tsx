import type { Page, ResolvedDataByNodePath } from '@/lib/layout';
import { Node, type RenderContext } from './Node';

export function LayoutPage({
  page,
  resolved,
  scriptFonts,
}: {
  page: Page;
  resolved?: ResolvedDataByNodePath;
  scriptFonts?: Set<string>;
}) {
  const ctx: RenderContext = { path: 'root' };
  if (resolved !== undefined) ctx.resolved = resolved;
  if (scriptFonts !== undefined) ctx.scriptFonts = scriptFonts;
  return (
    <main data-page-slug={page.slug} data-page-name={page.name} className="w-full">
      <Node node={page.root} ctx={ctx} />
    </main>
  );
}
