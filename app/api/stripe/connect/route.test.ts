// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1' } }) }));
const { GET } = await import('./route');

describe('Connect Stripe', () => {
  it('comes back to Getting paid saying Stripe isn’t set up yet', async () => {
    const res = await GET(new Request('https://app.bohdiai.com/api/stripe/connect'));
    expect(res.headers.get('location')).toBe('https://app.bohdiai.com/manage/payments?stripe=not-set-up');
  });
});
