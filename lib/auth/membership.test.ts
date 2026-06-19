import { describe, it, expect, vi, beforeEach } from 'vitest';

// Configurable per-test results for the faked supabase query chains.
let selectResult: { data: unknown; error: unknown } = { data: null, error: null };
let listResult: { data: unknown[]; error: unknown } = { data: [], error: null };
let insertResult: { error: unknown } = { error: null };
const insertedRows: unknown[] = [];

function makeBuilder() {
  const builder: Record<string, unknown> = {
    insert(row: unknown) {
      insertedRows.push(row);
      return Promise.resolve(insertResult);
    },
    select() {
      return builder;
    },
    eq() {
      return builder;
    },
    maybeSingle() {
      return Promise.resolve(selectResult);
    },
    // Thenable so an un-terminated chain (list query) awaits to listResult.
    then(onfulfilled: (v: unknown) => unknown) {
      return Promise.resolve(listResult).then(onfulfilled);
    },
  };
  return builder;
}

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({ from: () => makeBuilder() }),
}));

import { addShopOwner, isShopAdmin, getUserShops } from './membership';

const USER = '11111111-1111-1111-1111-111111111111';
const TENANT = '22222222-2222-2222-2222-222222222222';

beforeEach(() => {
  selectResult = { data: null, error: null };
  listResult = { data: [], error: null };
  insertResult = { error: null };
  insertedRows.length = 0;
});

describe('addShopOwner', () => {
  it('inserts an active admin membership when none exists', async () => {
    selectResult = { data: null, error: null };

    await addShopOwner(USER, TENANT);

    expect(insertedRows).toHaveLength(1);
    expect(insertedRows[0]).toEqual({
      user_id: USER,
      tenant_id: TENANT,
      role: 'admin',
      status: 'active',
    });
  });

  it('is idempotent — does not insert when an active membership already exists', async () => {
    selectResult = { data: { id: 'existing', role: 'admin' }, error: null };

    await addShopOwner(USER, TENANT);

    expect(insertedRows).toHaveLength(0);
  });

  it('throws when the insert fails', async () => {
    selectResult = { data: null, error: null };
    insertResult = { error: { message: 'insert blew up' } };

    await expect(addShopOwner(USER, TENANT)).rejects.toThrow(/shop owner/i);
  });

  it('throws when the membership check errors', async () => {
    selectResult = { data: null, error: { message: 'db down' } };
    await expect(addShopOwner(USER, TENANT)).rejects.toThrow(/membership/i);
    expect(insertedRows).toHaveLength(0);
  });
});

describe('isShopAdmin', () => {
  it('returns true when an active admin membership exists', async () => {
    selectResult = { data: { id: 'm1' }, error: null };
    expect(await isShopAdmin(USER, TENANT)).toBe(true);
  });

  it('returns false when no matching membership exists', async () => {
    selectResult = { data: null, error: null };
    expect(await isShopAdmin(USER, TENANT)).toBe(false);
  });

  it('throws when the query errors', async () => {
    selectResult = { data: null, error: { message: 'db down' } };
    await expect(isShopAdmin(USER, TENANT)).rejects.toThrow(/shop admin/i);
  });
});

describe('getUserShops', () => {
  it('maps active admin memberships to shop summaries', async () => {
    listResult = {
      data: [
        { tenant_id: TENANT, tenants: { subdomain: 'ember', business_name: 'Ember Candles' } },
      ],
      error: null,
    };

    const shops = await getUserShops(USER);

    expect(shops).toEqual([
      { tenantId: TENANT, subdomain: 'ember', businessName: 'Ember Candles' },
    ]);
  });

  it('returns an empty array when the user owns no shops', async () => {
    listResult = { data: [], error: null };
    expect(await getUserShops(USER)).toEqual([]);
  });

  it('treats a null data payload as no shops', async () => {
    listResult = { data: null as unknown as unknown[], error: null };
    expect(await getUserShops(USER)).toEqual([]);
  });

  it('skips memberships whose tenant join came back null', async () => {
    listResult = {
      data: [
        { tenant_id: TENANT, tenants: null },
        { tenant_id: 'live', tenants: { subdomain: 'ember', business_name: 'Ember' } },
      ],
      error: null,
    };

    const shops = await getUserShops(USER);

    expect(shops).toEqual([{ tenantId: 'live', subdomain: 'ember', businessName: 'Ember' }]);
  });

  it('throws when the query errors', async () => {
    listResult = { data: [], error: { message: 'db down' } };
    await expect(getUserShops(USER)).rejects.toThrow(/shops/i);
  });
});
