import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { loadSiteReports } from './load';

function db(answer: { data: unknown[] | null; error: { message: string } | null }) {
  const chain = {
    select: () => chain,
    order: () => chain,
    limit: async () => answer,
  };
  return { from: () => chain } as unknown as SupabaseClient<Database>;
}

describe('loadSiteReports (go-live step 3)', () => {
  it('gives each report with its site, and a site since removed by name', async () => {
    const rows = await loadSiteReports(
      db({
        data: [
          {
            id: 'r1',
            tenant_id: 't1',
            reason: 'scam',
            details: 'x',
            email: '',
            created_at: '2026-11-16T10:00:00Z',
            tenants: { business_name: 'Rustic Charm', subdomain: 'rustic-charm', status: 'active' },
          },
          {
            id: 'r2',
            tenant_id: 't2',
            reason: 'odd',
            details: 'y',
            email: 'a@b.co',
            created_at: '2026-11-16T09:00:00Z',
            tenants: null,
          },
        ],
        error: null,
      }),
    );
    expect(rows[0]).toMatchObject({
      siteName: 'Rustic Charm',
      subdomain: 'rustic-charm',
      status: 'active',
      reason: 'scam',
    });
    expect(rows[1]).toMatchObject({
      siteName: 'A site since removed',
      subdomain: '',
      status: '',
      reason: 'other',
    });
  });
  it('says so when the reports can’t be read', async () => {
    await expect(loadSiteReports(db({ data: null, error: { message: 'down' } }))).rejects.toThrow(
      'Could not read the reports: down',
    );
  });
});
