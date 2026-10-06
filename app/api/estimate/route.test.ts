// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const TENANT = '4b8f0f5e-8f3a-4a57-9a8e-1f2d3c4b5a69';

const send = vi.fn();
let askedStatuses: string[] = [];
let tenantRow: { business_name: string; contact_email: string | null } | null = { business_name: 'Cut-Pro', contact_email: 'crew@example.com' };

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/resend', () => ({ resend: () => ({ emails: { send } }), fromEmail: () => 'BohdiAI <site@example.com>' }));
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          in: (_col: string, statuses: string[]) => {
            askedStatuses = statuses;
            return { maybeSingle: async () => ({ data: tenantRow, error: null }) };
          },
        }),
      }),
    }),
  }),
}));

const shrinkImage = vi.fn();
vi.mock('@/lib/images/shrink', () => ({ shrinkImage: (...a: unknown[]) => shrinkImage(...a) }));

const allowFormSubmit = vi.fn();
vi.mock('@/lib/forms/rate-limit', () => ({ allowFormSubmit: (...a: unknown[]) => allowFormSubmit(...a) }));

const { POST } = await import('./route');

function request(fields: Record<string, string>, photos: File[] = []): Request {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  for (const p of photos) f.append('photos', p);
  return new Request('http://shop.localhost/api/estimate', { method: 'POST', body: f });
}

const good = { tenantId: TENANT, name: 'Pat', phone: '401 555 0100', email: 'pat@example.com', town: 'Warwick', state: 'Rhode Island' };

describe('POST /api/estimate', () => {
  it('takes requests for live sites and for drafts opened by their preview link', async () => {
    await POST(request(good));
    expect(askedStatuses).toEqual(['active', 'draft']);
  });

  beforeEach(() => {
    send.mockReset().mockResolvedValue({ data: { id: 'e1' }, error: null });
    tenantRow = { business_name: 'Cut-Pro', contact_email: 'crew@example.com' };
    shrinkImage.mockReset().mockResolvedValue(new Uint8Array([7, 7, 7]));
    allowFormSubmit.mockReset().mockResolvedValue('allowed');
  });

  it('emails the business with the customer as reply-to and the photos shrunk to JPEG', async () => {
    const res = await POST(request(good, [new File([new Uint8Array([1, 2, 3])], 'yard.png', { type: 'image/png' })]));
    expect(res.status).toBe(200);
    const msg = send.mock.calls[0]?.[0] as { to: string; replyTo: string; subject: string; attachments: Array<{ filename: string; content: Buffer }> };
    expect(msg.to).toBe('crew@example.com');
    expect(msg.replyTo).toBe('pat@example.com');
    expect(msg.subject).toContain('Warwick, Rhode Island');
    expect(msg.attachments).toHaveLength(1);
    expect(msg.attachments[0]?.filename).toBe('yard-photo-1.jpg');
    expect(Array.from(msg.attachments[0]?.content ?? [])).toEqual([7, 7, 7]);
    expect(shrinkImage).toHaveBeenCalledWith(expect.any(ArrayBuffer), { maxEdge: 1800, format: 'jpeg', quality: 80 });
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
    shrinkImage.mockRejectedValue(new Error('9412: not an image'));
    const res = await POST(request(good, [new File(['not an image'], 'yard.jpg', { type: 'image/jpeg' })]));
    expect(res.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it('turns away a visitor who has sent too many, without sending', async () => {
    allowFormSubmit.mockResolvedValue('limited');
    const res = await POST(request(good));
    expect(res.status).toBe(429);
    expect(((await res.json()) as { error: string }).error).toMatch(/wait a minute/i);
    expect(allowFormSubmit).toHaveBeenCalledWith(expect.any(Request), 'estimate');
    expect(send).not.toHaveBeenCalled();
  });

  it('asks the visitor to call when the limiter is down, instead of sending unchecked', async () => {
    allowFormSubmit.mockResolvedValue('unavailable');
    const res = await POST(request(good));
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toMatch(/call us/i);
    expect(send).not.toHaveBeenCalled();
  });
});
