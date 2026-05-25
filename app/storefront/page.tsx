import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { renderBlock } from '@/lib/block-registry';

export default async function StorefrontHomePage() {
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');

  if (tenantId === null) notFound();

  const db = supabaseAdmin();

  // Fetch the home content page
  const { data: page } = await db
    .from('content_pages')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', '/')
    .eq('status', 'published')
    .single();

  if (page === null) notFound();

  // Fetch page blocks in position order
  const { data: blocks } = await db
    .from('page_blocks')
    .select('block_key, position, content')
    .eq('page_id', page.id)
    .eq('is_visible', true)
    .order('position', { ascending: true });

  return (
    <main>
      {(blocks ?? []).map((block) =>
        renderBlock(
          block as { block_key: string; position: number; content: Record<string, unknown> },
          tenantId,
        )
      )}
    </main>
  );
}
