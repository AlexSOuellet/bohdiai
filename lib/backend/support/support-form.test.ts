import { describe, expect, it } from 'vitest';
import { checkSupportMessage, supportEmail, SUPPORT_MESSAGE_MAX } from './support-form';

describe('checkSupportMessage', () => {
  it('keeps a message, trimmed', () => {
    expect(checkSupportMessage('  How do I add a market?  ')).toEqual({ ok: true, message: 'How do I add a market?' });
  });
  it('needs a message, and says how long is too long', () => {
    expect(checkSupportMessage('   ')).toEqual({ ok: false, error: 'Write your message first.' });
    const long = 'a'.repeat(SUPPORT_MESSAGE_MAX + 1);
    expect(checkSupportMessage(long)).toEqual({ ok: false, error: `Your message is ${long.length} characters. Keep it to ${SUPPORT_MESSAGE_MAX}.` });
  });
});

describe('supportEmail', () => {
  it('says who it is from and which site', () => {
    expect(supportEmail({ siteName: 'Lena Hart Decoupage', subdomain: 'lena', email: 'lena@example.com', message: 'Hi' })).toEqual({
      subject: 'Support: Lena Hart Decoupage',
      text: 'From: lena@example.com\nSite: Lena Hart Decoupage (lena.bohdiai.com)\n\nHi',
    });
  });
});
