// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Every public form consults the limiter before it reads the body, touches the
// database, or sends email. A turned-away visitor gets the limiter's answer and
// nothing else happens.

const formLimitResponse = vi.fn();
vi.mock('@/lib/forms/rate-limit', () => ({
  formLimitResponse: (...a: unknown[]) => formLimitResponse(...a),
  clientIp: () => '203.0.113.7',
}));

const touched = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => {
    touched('db');
    throw new Error('the database must not be reached for a turned-away visitor');
  },
}));
vi.mock('@/lib/resend', () => ({
  resend: () => {
    touched('email');
    throw new Error('no email for a turned-away visitor');
  },
  fromEmail: () => 'BohdiAI <site@example.com>',
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/env', () => ({ serverEnv: () => ({ SITE_URL: 'https://bohdiai.com' }) }));

const ROUTES = [
  { name: 'contact', load: () => import('./contact/route'), shape: { error: 'slow down' } },
  { name: 'order', load: () => import('./order-request/route'), shape: { error: 'slow down' } },
  { name: 'market', load: () => import('./market/hold/route'), shape: { error: 'slow down' } },
  { name: 'market-step', load: () => import('./market/paid/route'), shape: { error: 'slow down' } },
  { name: 'market-step', load: () => import('./market/release/route'), shape: { error: 'slow down' } },
  { name: 'inquiry', load: () => import('./inquiry/route'), shape: { error: 'slow down' } },
  { name: 'notify-interest', load: () => import('./notify-interest/route'), shape: { error: 'slow down' } },
] as const;

describe('public forms are rate limited', () => {
  beforeEach(() => {
    formLimitResponse.mockReset();
    touched.mockReset();
  });

  for (const route of ROUTES) {
    it(`${route.name}: a turned-away visitor gets the limiter's answer and nothing runs`, async () => {
      formLimitResponse.mockImplementation((_req: Request, _form: string, toBody: (m: string) => unknown) =>
        Promise.resolve(Response.json(toBody('slow down'), { status: 429 })),
      );
      const { POST } = await route.load();
      const res = await POST(new Request('https://shop.bohdiai.com/api/x', { method: 'POST', body: '{}' }));
      expect(res.status).toBe(429);
      expect(await res.json()).toEqual(route.shape);
      expect(formLimitResponse).toHaveBeenCalledWith(expect.any(Request), route.name, expect.any(Function));
      expect(touched).not.toHaveBeenCalled();
    });
  }
});
