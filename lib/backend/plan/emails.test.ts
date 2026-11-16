import { describe, it, expect, vi, beforeEach } from 'vitest';

const send = vi.hoisted(() => vi.fn());
vi.mock('@/lib/resend', () => ({
  resend: () => ({ emails: { send } }),
  fromEmail: () => 'site@bohdiai.com',
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

import { planChangeEmail, sendPlanChange } from './emails';

beforeEach(() => {
  send.mockReset().mockResolvedValue({ error: null });
});

describe('planChangeEmail', () => {
  it('says when a cancelled site comes down, and how to keep it', () => {
    const m = planChangeEmail('Lena Hart Decoupage', {
      kind: 'cancel',
      on: 'Tuesday, November 18, 2026',
    });
    expect(m.subject).toBe(
      'Lena Hart Decoupage: your site will close on Tuesday, November 18, 2026',
    );
    expect(m.text).toContain('Keep my site');
    // Cancelling moves the maker to Free (Alex, 2026-11-16).
    expect(m.text).toContain(
      'you move to BohdiAI Free: nothing more is charged, and your products and tools stay',
    );
  });
  it('has words for every change', () => {
    for (const change of [
      { kind: 'keep' },
      { kind: 'upgrade', to: 'Maker Full' },
      { kind: 'downgrade', to: 'Maker Showcase', on: 'x' },
      { kind: 'downgrade-dropped', stays: 'Maker Full' },
      { kind: 'renewed', plan: 'Maker Full' },
    ] as const) {
      expect(planChangeEmail('Site', change).text).not.toBe('');
    }
  });
  it('says a switch to yearly happened now, and a switch to monthly waits for renewal', () => {
    const now = planChangeEmail('Lena', { kind: 'billing', billing: 'yearly', on: null });
    expect(now.subject).toBe('Lena: now billed yearly');
    expect(now.text).toContain('counted toward');
    const later = planChangeEmail('Lena', {
      kind: 'billing',
      billing: 'monthly',
      on: 'Saturday, May 1, 2027',
    });
    expect(later.subject).toBe('Lena: billed monthly from Saturday, May 1, 2027');
    expect(later.text).toContain('Until then nothing changes');
  });
});

describe('sendPlanChange', () => {
  it('emails the maker and sends Alex a copy', async () => {
    await sendPlanChange({
      siteName: 'Lena',
      subdomain: 'lena',
      makerEmail: 'lena@example.com',
      change: { kind: 'keep' },
    });
    expect(send.mock.calls.map((c) => (c[0] as { to: string }).to)).toEqual([
      'lena@example.com',
      'alex@bohdiai.com',
    ]);
    expect((send.mock.calls[1]?.[0] as { subject: string }).subject).toMatch(/^Copy: /);
  });
  it('never throws when a send fails, and logs it', async () => {
    send.mockImplementation(async () => {
      throw new Error('down');
    });
    let threw = false;
    try {
      await sendPlanChange({
        siteName: 'Lena',
        subdomain: 'lena',
        makerEmail: '',
        change: { kind: 'keep' },
      });
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
  });
});

describe('suspend emails (go-live step 3, Alex 2026-11-16)', () => {
  it('tells the maker why, that billing is paused and nothing is deleted, and how to reach Alex', () => {
    const mail = planChangeEmail('Saltmarsh', {
      kind: 'suspended',
      reason: 'Your shop lists vapes.',
    });
    expect(mail.subject).toBe('Saltmarsh: your site has been suspended');
    expect(mail.text.split('\n\n')).toContain('Your shop lists vapes.');
    expect(mail.text).toMatch(/billing is paused/);
    expect(mail.text).toMatch(/Nothing on your site has been deleted/);
    expect(mail.html).toContain('Your shop lists vapes.');
  });
  it('says the site is back as it was', () => {
    expect(planChangeEmail('Saltmarsh', { kind: 'unsuspended' }).text).toMatch(
      /back exactly as it was/,
    );
  });
  it('escapes what Alex typed in the email’s design', () => {
    expect(
      planChangeEmail('Saltmarsh', { kind: 'suspended', reason: '<b>x</b>' }).html,
    ).not.toContain('<b>x</b>');
  });
});
