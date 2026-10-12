import { describe, it, expect, vi } from 'vitest';

const maybeSingle = vi.fn();
const chain = { select: () => chain, eq: () => chain, is: () => chain, maybeSingle };
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({ from: () => chain }) }));

const { GET } = await import('./route');
const call = (shop: string) => GET(new Request(`http://app.localhost/pos-manifest/${shop}`), { params: Promise.resolve({ shop }) });

describe('GET /pos-manifest/[shop]', () => {
  it('names the app after the shop', async () => {
    maybeSingle.mockResolvedValueOnce({ data: { business_name: 'Saltmarsh & Lace' } });
    const res = await call('saltmarsh-and-lace');
    expect(res.headers.get('content-type')).toBe('application/manifest+json');
    expect(((await res.json()) as { name: string }).name).toBe('Saltmarsh & Lace Market POS');
  });
  it('falls back to plain Market POS for an unknown or odd shop, without looking up the odd one', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null });
    expect(((await (await call('nobody')).json()) as { name: string }).name).toBe('Market POS');
    maybeSingle.mockClear();
    expect(((await (await call('Bad Shop!')).json()) as { name: string }).name).toBe('Market POS');
    expect(maybeSingle).not.toHaveBeenCalled();
  });
});
