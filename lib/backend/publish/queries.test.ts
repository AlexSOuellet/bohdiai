import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { getPublishView } from './queries';
import { previewCode } from '@/lib/storefront/draft-preview';

const SECRET = 'x'.repeat(40);

function db(result: { data: { status: string } | null; error: { message: string } | null }) {
  return { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve(result) }) }) }) } as unknown as SupabaseClient<Database>;
}

describe('getPublishView', () => {
  it('a draft gets its private link, made with this site’s secret', async () => {
    const view = await getPublishView(db({ data: { status: 'draft' }, error: null }), 't1', 'tide', SECRET);
    expect(view).toEqual({ draft: true, previewUrl: `https://tide.bohdiai.com/?preview=${await previewCode(SECRET, 'tide')}` });
  });

  it('without a secret a draft has no link, and says so in the panel', async () => {
    expect(await getPublishView(db({ data: { status: 'draft' }, error: null }), 't1', 'tide', undefined)).toEqual({ draft: true, previewUrl: null });
  });

  it('a live site shows no panel', async () => {
    expect(await getPublishView(db({ data: { status: 'active' }, error: null }), 't1', 'tide', SECRET)).toEqual({ draft: false });
    expect(await getPublishView(db({ data: null, error: null }), 't1', 'tide', SECRET)).toEqual({ draft: false });
  });

  it('a failed read throws, so the page shows its error', async () => {
    await expect(getPublishView(db({ data: null, error: { message: 'down' } }), 't1', 'tide', SECRET)).rejects.toThrow('down');
  });
});
