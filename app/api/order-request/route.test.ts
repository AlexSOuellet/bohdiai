// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as Catalog from '@/lib/storefront/catalog';

const TENANT = '4b8f0f5e-8f3a-4a57-9a8e-1f2d3c4b5a69';
const A = '00000000-0000-4000-8000-000000000001';

const send = vi.fn();
const rpc = vi.fn();
let tenantRow: { business_name: string; contact_email: string | null } | null;
let features: Set<string>;
let loaded: unknown[];

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/resend', () => ({ resend: () => ({ emails: { send } }), fromEmail: () => 'BohdiAI <site@example.com>' }));
vi.mock('@/lib/forms/rate-limit', () => ({ formLimitResponse: async () => null }));
vi.mock('@/lib/backend/features', () => ({ loadSiteFeatures: async () => features }));
let promos: unknown[] = [];
vi.mock('@/lib/storefront/promotions-load', () => ({ loadShopPromotions: async () => ({ promos, today: '2026-10-07' }) }));
vi.mock('@/lib/storefront/catalog', async (orig) => ({
  ...(await orig<typeof Catalog>()),
  loadProductsByIds: async () => loaded,
}));
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: tenantRow, error: null }) }) }) }) }),
    rpc: (...a: unknown[]) => rpc(...a),
  }),
}));

const { POST } = await import('./route');

const theo = {
  view: { id: A, slug: 'theo', name: 'Theo', price: '$120', description: '', status: 'active', media: [], variations: [] },
  priceCents: 12000,
  isPreview: false,
};

function request(body: unknown, tenant: string | null = TENANT): Request {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (tenant !== null) headers.set('x-tenant-id', tenant);
  return new Request('https://rose-n-cat.bohdiai.com/api/order-request', { method: 'POST', headers, body: JSON.stringify(body) });
}

const good = { name: 'Pat', email: 'pat@example.com', phone: '401 555 0100', note: 'Pickup please', listingIds: [A] };

describe('POST /api/order-request', () => {
  beforeEach(() => {
    send.mockReset().mockResolvedValue({ data: { id: 'e1' }, error: null });
    rpc.mockReset().mockResolvedValue({ data: '1001', error: null });
    tenantRow = { business_name: 'Rose n’ Cat', contact_email: 'renee@example.com' };
    features = new Set(['cart']);
    loaded = [theo];
    promos = [];
  });

  it('saves the order priced from the catalog and emails the maker', async () => {
    const res = await POST(request({ ...good, listingIds: [A] }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, orderNumber: '1001' });
    expect(rpc).toHaveBeenCalledWith('place_order_request', {
      p_tenant_id: TENANT,
      p_customer_name: 'Pat',
      p_customer_email: 'pat@example.com',
      p_customer_phone: '401 555 0100',
      p_customer_note: 'Pickup please',
      p_items: [{ listing_id: A, name: 'Theo', unit_price_cents: 12000 }],
      p_discount_cents: 0,
    });
    const msg = send.mock.calls[0]?.[0] as { to: string; replyTo: string; subject: string };
    expect(msg.to).toBe('renee@example.com');
    expect(msg.replyTo).toBe('pat@example.com');
    expect(msg.subject).toContain('#1001');
  });

  it('refuses a shop without the cart', async () => {
    features = new Set();
    const res = await POST(request(good));
    expect(res.status).toBe(404);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('needs the shop from the host', async () => {
    const res = await POST(request(good, null));
    expect(res.status).toBe(404);
  });

  it('names a piece that was adopted meanwhile', async () => {
    loaded = [{ ...theo, view: { ...theo.view, status: 'sold_out' } }];
    const res = await POST(request(good));
    expect(res.status).toBe(409);
    expect(((await res.json()) as { error: string }).error).toContain('Theo');
    expect(rpc).not.toHaveBeenCalled();
  });

  it('turns a race lost in the database into a clear message', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'P0021', message: 'not available' } });
    const res = await POST(request(good));
    expect(res.status).toBe(409);
  });

  it('keeps the order when the email fails', async () => {
    send.mockResolvedValue({ data: null, error: { message: 'down' } });
    const res = await POST(request(good));
    expect(res.status).toBe(200);
  });

  it('answers ok to a bot and saves nothing', async () => {
    const res = await POST(request({ ...good, company: 'spam' }));
    expect(res.status).toBe(200);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('rejects a missing email', async () => {
    const res = await POST(request({ ...good, email: '' }));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/order-request with promotions', () => {
  const code = { id: 'c1', kind: 'code', name: 'MARKET10', code: 'MARKET10', percentOff: 10, amountOffCents: null, startsOn: null, endsOn: null, maxUses: 5, uses: 0, active: true };
  beforeEach(() => {
    send.mockReset().mockResolvedValue({ data: { id: 'e1' }, error: null });
    rpc.mockReset().mockResolvedValue({ data: '1001', error: null });
    tenantRow = { business_name: 'Rose n’ Cat', contact_email: 'renee@example.com' };
    features = new Set(['cart']);
    loaded = [theo];
    promos = [code];
  });

  it('takes the code off, records it, and counts its use', async () => {
    const res = await POST(request({ ...good, code: 'market10' }));
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('place_order_request', expect.objectContaining({ p_discount_cents: 1200, p_discount_label: 'MARKET10', p_promotion_id: 'c1' }));
    expect((send.mock.calls[0]?.[0] as { text: string }).text).toContain('Discount (MARKET10): -$12');
  });

  it('refuses a code that no longer works', async () => {
    promos = [{ ...code, uses: 5 }];
    const res = await POST(request({ ...good, code: 'MARKET10' }));
    expect(res.status).toBe(409);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('turns a code used up meanwhile into a clear message', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'P0022', message: 'promotion ended' } });
    const res = await POST(request({ ...good, code: 'MARKET10' }));
    expect(res.status).toBe(409);
  });

  it('applies a running sale with no code', async () => {
    promos = [{ ...code, id: 's1', kind: 'sale', name: 'Fall Sale', code: null, percentOff: 25, maxUses: null }];
    await POST(request(good));
    expect(rpc).toHaveBeenCalledWith('place_order_request', expect.objectContaining({ p_discount_cents: 3000, p_discount_label: 'Fall Sale' }));
    expect(rpc.mock.calls[0]?.[1]).not.toHaveProperty('p_promotion_id');
  });
});
