import type { Page } from '@/lib/layout';
import { Node, type RenderContext } from './Node';

export function LayoutPage({ page }: { page: Page }) {
  const ctx: RenderContext = {};
  return (
    <main data-page-slug={page.slug} data-page-name={page.name} className="w-full">
      <Node node={page.root} ctx={ctx} />
    </main>
  );
}
