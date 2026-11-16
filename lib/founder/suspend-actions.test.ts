import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  suspendSite: vi.fn(),
  unsuspendSite: vi.fn(),
  sendPlanChange: vi.fn(),
  sites: [
    { id: 't1', name: 'Rustic Charm', subdomain: 'rustic-charm', maker: 'maker@example.com' },
  ] as unknown[],
  logError: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('./access', () => ({ requireFounder: async () => ({ id: 'alex' }) }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({}) }));
vi.mock('@/lib/billing/stripe', () => ({ stripe: () => ({}) }));
vi.mock('@/lib/logger', () => ({ logger: { error: h.logError } }));
vi.mock('./suspend', () => ({ suspendSite: h.suspendSite, unsuspendSite: h.unsuspendSite }));
vi.mock('./sites', () => ({ loadFounderSites: async () => h.sites }));
vi.mock('@/lib/backend/plan/emails', () => ({ sendPlanChange: h.sendPlanChange }));
const { suspendFromAdmin, unsuspendFromAdmin } = await import('./suspend-actions');

const form = (fields: Record<string, string>): FormData => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};

beforeEach(() => {
  h.suspendSite.mockReset();
  h.unsuspendSite.mockReset();
  h.sendPlanChange.mockReset();
  h.sites = [
    { id: 't1', name: 'Rustic Charm', subdomain: 'rustic-charm', maker: 'maker@example.com' },
  ];
});

describe('Suspend from the admin (go-live step 3, Alex 2026-11-16)', () => {
  it('needs a reason, because the maker sees it', async () => {
    expect(await suspendFromAdmin(null, form({ tenantId: 't1', reason: ' ' }))).toEqual({
      ok: false,
      message: 'Say why. The maker sees it in their email.',
    });
    expect(h.suspendSite).not.toHaveBeenCalled();
  });
  it('suspends, then emails the maker the reason', async () => {
    h.suspendSite.mockResolvedValue({ ok: true });
    const r = await suspendFromAdmin(null, form({ tenantId: 't1', reason: 'Vapes for sale' }));
    expect(r.ok).toBe(true);
    expect(h.sendPlanChange).toHaveBeenCalledWith({
      siteName: 'Rustic Charm',
      subdomain: 'rustic-charm',
      makerEmail: 'maker@example.com',
      change: { kind: 'suspended', reason: 'Vapes for sale' },
    });
  });
  it('says why it didn’t happen, and emails no one', async () => {
    h.suspendSite.mockResolvedValue({ ok: false, error: 'That site is already suspended.' });
    expect(await suspendFromAdmin(null, form({ tenantId: 't1', reason: 'x' }))).toEqual({
      ok: false,
      message: 'That site is already suspended.',
    });
    h.suspendSite.mockRejectedValue(new Error('boom'));
    expect((await suspendFromAdmin(null, form({ tenantId: 't1', reason: 'x' }))).message).toMatch(
      /nothing changed/,
    );
    expect(h.sendPlanChange).not.toHaveBeenCalled();
  });
  it('unsuspends and tells the maker; a site no longer listed gets no email', async () => {
    h.unsuspendSite.mockResolvedValue({ ok: true });
    expect((await unsuspendFromAdmin(null, form({ tenantId: 't1' }))).ok).toBe(true);
    expect(h.sendPlanChange).toHaveBeenCalledWith(
      expect.objectContaining({ change: { kind: 'unsuspended' } }),
    );
    h.sendPlanChange.mockReset();
    h.sites = [];
    await unsuspendFromAdmin(null, form({ tenantId: 't1' }));
    expect(h.sendPlanChange).not.toHaveBeenCalled();
    h.unsuspendSite.mockResolvedValue({ ok: false, error: 'That site isn’t suspended.' });
    expect(await unsuspendFromAdmin(null, form({ tenantId: 't1' }))).toEqual({
      ok: false,
      message: 'That site isn’t suspended.',
    });
  });
});
