import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { renderBlock } from '@/lib/block-registry';
import type { Json } from '@/lib/database.types';

// Narrows Supabase's Json type to the object shape renderBlock expects.
// Array-shaped or scalar content rows are skipped rather than erroring.
function contentToRecord(content: Json): Record<string, unknown> | null {
  if (typeof content !== 'object' || content === null || Array.isArray(content)) {
    return null;
  }
  return content as Record<string, unknown>;
}

export default async function StorefrontHomePage() {
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');

  if (tenantId === null) notFound();

  const db = supabaseAdmin();

  const { data: page } = await db
    .from('content_pages')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', '/')
    .eq('status', 'published')
    .single();

  if (page === null) notFound();

  const { data: blocks } = await db
    .from('page_blocks')
    .select('block_key, position, content')
    .eq('page_id', page.id)
    .eq('is_visible', true)
    .order('position', { ascending: true });

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <main>
      {(blocks ?? []).map((block) => {
        const content = contentToRecord(block.content);
        if (content === null) return null;
        const rendered = renderBlock(
          { block_key: block.block_key, position: block.position, content },
          tenantId,
        );
        if (!isDev) return rendered;
        return (
          <div key={block.block_key + block.position} style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 8, left: 8, zIndex: 9999,
              background: 'rgba(0,0,0,0.75)', color: '#facc15',
              fontFamily: 'monospace', fontSize: '11px', fontWeight: 600,
              padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.05em',
              pointerEvents: 'none', userSelect: 'none',
            }}>
              {block.block_key}
            </div>
            {rendered}
          </div>
        );
      })}
    </main>
  );
}
