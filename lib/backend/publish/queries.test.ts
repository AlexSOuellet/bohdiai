import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { getPublishView, getSiteOpen } from './queries';
import { previewCode } from '@/lib/storefront/draft-preview';

const SECRET = 'x'.repeat(40);

function db(result: { data: { status: string; plan?: string | null } | null; error: { message: string } | null }) {
  return { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve(result) }) }) }) } as unknown as SupabaseClient<Database>;
}

describe('getPublishView', () => {
  it('a draft gets its private link, made with this site’s secret', async () => {
    const view = await getPublishView(db({ data: { status: 'draft' }, error: null }), 't1', 'tide', SECRET);
    expect(view).toEqual({ draft: true, offline: false, previewUrl: `https://tide.bohdiai.com/?preview=${await previewCode(SECRET, 'tide')}` });
  });

  it('without a secret a draft has no link, and says so in the panel', async () => {
    expect(await getPublishView(db({ data: { status: 'draft' }, error: null }), 't1', 'tide', undefined)).toEqual({ draft: true, offline: false, previewUrl: null });
  });

  it('a live site shows no panel', async () => {
    expect(await getPublishView(db({ data: { status: 'active' }, error: null }), 't1', 'tide', SECRET)).toEqual({ draft: false, offline: false });
    expect(await getPublishView(db({ data: null, error: null }), 't1', 'tide', SECRET)).toEqual({ draft: false, offline: false });
  });

  it('a failed read throws, so the page shows its error', async () => {
    await expect(getPublishView(db({ data: null, error: { message: 'down' } }), 't1', 'tide', SECRET)).rejects.toThrow('down');
  });
});

describe('getSiteOpen (Publish wherever the site is shown, Session 119)', () => {
  it('a private site can be published, and opens through its private link on this host', async () => {
    const open = await getSiteOpen(db({ data: { status: 'draft', plan: 'lite' }, error: null }), 't1', 'tide', SECRET, 'app.bohdiai.com');
    expect(open).toEqual({ canPublish: true, openUrl: `https://tide.bohdiai.com/?preview=${await previewCode(SECRET, 'tide')}` });
    const local = await getSiteOpen(db({ data: { status: 'draft', plan: 'full' }, error: null }), 't1', 'tide', SECRET, 'app.localhost:3000');
    expect(local.openUrl.startsWith('http://tide.localhost:3000/?preview=')).toBe(true);
  });

  it('a live site has nothing to publish and opens plainly', async () => {
    expect(await getSiteOpen(db({ data: { status: 'active', plan: 'lite' }, error: null }), 't1', 'tide', SECRET, 'app.bohdiai.com')).toEqual({ canPublish: false, openUrl: 'https://tide.bohdiai.com' });
  });

  it('Free has no site to publish', async () => {
    expect((await getSiteOpen(db({ data: { status: 'draft', plan: 'free' }, error: null }), 't1', 'tide', SECRET, 'app.bohdiai.com')).canPublish).toBe(false);
  });
});

describe('an offline site (Session 119)', () => {
  it('keeps its private link for its maker, and has nothing to publish', async () => {
    const view = await getPublishView(db({ data: { status: 'offline' }, error: null }), 't1', 'tide', SECRET);
    expect(view).toEqual({ draft: false, offline: true, previewUrl: `https://tide.bohdiai.com/?preview=${await previewCode(SECRET, 'tide')}` });
    const open = await getSiteOpen(db({ data: { status: 'offline', plan: 'lite' }, error: null }), 't1', 'tide', SECRET, 'app.bohdiai.com');
    expect(open).toEqual({ canPublish: false, openUrl: `https://tide.bohdiai.com/?preview=${await previewCode(SECRET, 'tide')}` });
  });
});
