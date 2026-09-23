// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import sharp from 'sharp';

const TENANT = '4b8f0f5e-8f3a-4a57-9a8e-1f2d3c4b5a69';

const send = vi.fn();
let tenantRow: { business_name: string; contact_email: string | null } | null = { business_name: 'Cut-Pro', contact_email: 'crew@example.com' };

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/resend', () => ({ resend: () => ({ emails: { send } }), fromEmail: () => 'BohdiAI <site@example.com>' }));
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: tenantRow, error: null }) }) }) }),
    }),
  }),
}));

const { POST } = await import('./route');

function request(fields: Record<string, string>, photos: File[] = []): Request {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  for (const p of photos) f.append('photos', p);
  return new Request('http://shop.localhost/api/estimate', { method: 'POST', body: f });
}

const good = { tenantId: TENANT, name: 'Pat', phone: '401 555 0100', email: 'pat@example.com', town: 'Warwick', state: 'Rhode Island' };

describe('POST /api/estimate', () => {
  beforeEach(() => {
    send.mockReset().mockResolvedValue({ data: { id: 'e1' }, error: null });
    tenantRow = { business_name: 'Cut-Pro', contact_email: 'crew@example.com' };
  });

  it('emails the business with the customer as reply-to and the photos shrunk to JPEG', async () => {
    const png = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#3dae3f' } }).png().toBuffer();
    const res = await POST(request(good, [new File([new Uint8Array(png)], 'yard.png', { type: 'image/png' })]));
    expect(res.status).toBe(200);
    const msg = send.mock.calls[0]?.[0] as { to: string; replyTo: string; subject: string; attachments: Array<{ filename: string; content: Buffer }> };
    expect(msg.to).toBe('crew@example.com');
    expect(msg.replyTo).toBe('pat@example.com');
    expect(msg.subject).toContain('Warwick, Rhode Island');
    expect(msg.attachments).toHaveLength(1);
    const meta = await sharp(msg.attachments[0]?.content).metadata();
    expect(meta.format).toBe('jpeg');
    expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBeLessThanOrEqual(1800);
  });

  it('answers ok to a bot and sends nothing', async () => {
    const res = await POST(request({ ...good, company: 'spam co' }));
    expect(res.status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });

  it('rejects a request with no way to reach the customer', async () => {
    const res = await POST(request({ tenantId: TENANT, name: 'Pat' }));
    expect(res.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it('404s for an unknown or inactive site', async () => {
    tenantRow = null;
    expect((await POST(request(good))).status).toBe(404);
  });

  it('tells the visitor to call when the site has no inbox set', async () => {
    tenantRow = { business_name: 'Cut-Pro', contact_email: null };
    const res = await POST(request(good));
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toContain('call');
  });

  it('reports a failed send instead of pretending', async () => {
    send.mockResolvedValue({ data: null, error: { message: 'domain not verified' } });
    expect((await POST(request(good))).status).toBe(502);
    send.mockRejectedValue(new Error('network'));
    expect((await POST(request(good))).status).toBe(502);
  });

  it('rejects a photo that is not really an image', async () => {
    const res = await POST(request(good, [new File(['not an image'], 'yard.jpg', { type: 'image/jpeg' })]));
    expect(res.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });
});
