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
