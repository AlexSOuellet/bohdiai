import type * as PlanChange from '@/lib/billing/plan-change';
import { describe, it, expect, vi } from 'vitest';

const pc = vi.hoisted(() => ({
  findPrice: vi.fn(async (_s: unknown, _plan: string, billing: string) => ({ id: `price_${billing}`, unit_amount: billing === 'yearly' ? 25000 : 2500 })),
  previewNow: vi.fn(async (_s: unknown, _id: string, price: { id: string }) => ({ amount_due: price.id === 'price_yearly' ? 24000 : 1000, total: 1000, starting_balance: 0, ending_balance: 0, lines: { data: [{ amount: 1000 }] } })),
}));
vi.mock('@/lib/billing/stripe', () => ({ stripe: () => ({}) }));
vi.mock('@/lib/billing/plan-change', async (orig) => ({ ...(await orig<typeof PlanChange>()), ...pc }));
const { upgradeQuotes } = await import('./quotes');

describe('upgradeQuotes', () => {
  it('asks Stripe for both ways of paying and shows its own amounts', async () => {
    const q = await upgradeQuotes('sub_1', { plan: 'lite', billing: 'monthly', renewsOn: '2026-11-20', today: '2026-11-10' }, 'full');
    expect(pc.previewNow).toHaveBeenCalledWith({}, 'sub_1', expect.objectContaining({ id: 'price_monthly' }));
    expect(pc.previewNow).toHaveBeenCalledWith({}, 'sub_1', expect.objectContaining({ id: 'price_yearly' }));
    expect(q.monthly).toMatchObject({ todayCents: 1000, priceCents: 2500, prorated: true, renewsOn: '2026-11-20' });
    expect(q.yearly).toMatchObject({ todayCents: 24000, priceCents: 25000, prorated: false, renewsOn: '2027-11-10' });
  });
  it('a price with no amount counts as nothing', async () => {
    pc.findPrice.mockResolvedValue({ id: 'price_monthly', unit_amount: null } as never);
    const q = await upgradeQuotes('sub_1', { plan: 'lite', billing: 'monthly', renewsOn: '2026-11-20', today: '2026-11-10' }, 'full');
    expect(q.monthly.priceCents).toBe(0);
  });
});
