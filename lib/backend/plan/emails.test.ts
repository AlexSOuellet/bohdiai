import { describe, it, expect, vi, beforeEach } from 'vitest';

const send = vi.hoisted(() => vi.fn());
vi.mock('@/lib/resend', () => ({ resend: () => ({ emails: { send } }), fromEmail: () => 'site@bohdiai.com' }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

import { planChangeEmail, sendPlanChange } from './emails';

beforeEach(() => {
  send.mockReset().mockResolvedValue({ error: null });
});

describe('planChangeEmail', () => {
  it('says when a cancelled site comes down, and how to keep it', () => {
    const m = planChangeEmail('Lena Hart Decoupage', { kind: 'cancel', on: 'Tuesday, November 18, 2026' });
    expect(m.subject).toBe('Lena Hart Decoupage: your site will close on Tuesday, November 18, 2026');
    expect(m.text).toContain('Keep my site');
  });
  it('has words for every change', () => {
    for (const change of [{ kind: 'keep' }, { kind: 'upgrade', to: 'Maker Full' }, { kind: 'downgrade', to: 'Maker Showcase', on: 'x' }, { kind: 'downgrade-dropped', stays: 'Maker Full' }, { kind: 'renewed', plan: 'Maker Full' }] as const) {
      expect(planChangeEmail('Site', change).text).not.toBe('');
    }
  });
});

describe('sendPlanChange', () => {
  it('emails the maker and sends Alex a copy', async () => {
    await sendPlanChange({ siteName: 'Lena', subdomain: 'lena', makerEmail: 'lena@example.com', change: { kind: 'keep' } });
    expect(send.mock.calls.map((c) => (c[0] as { to: string }).to)).toEqual(['lena@example.com', 'alex@bohdiai.com']);
    expect((send.mock.calls[1]?.[0] as { subject: string }).subject).toMatch(/^Copy: /);
  });
  it('never throws when a send fails, and logs it', async () => {
    send.mockImplementation(async () => {
      throw new Error('down');
    });
    let threw = false;
    try {
      await sendPlanChange({ siteName: 'Lena', subdomain: 'lena', makerEmail: '', change: { kind: 'keep' } });
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
  });
});
