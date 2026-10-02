import { describe, it, expect } from 'vitest';
import { parseInquiry, composeInquiryEmail } from './request';

const good = { name: 'Pat Doe', email: 'pat@example.com', kind: 'maker', message: 'I make candles and need a shop.', link: 'https://instagram.com/pat' };

describe('parseInquiry', () => {
  it('treats a filled honeypot as spam', () => {
    expect(parseInquiry({ ...good, company: 'ACME' })).toEqual({ kind: 'spam' });
  });

  it('rejects a body that is not an object', () => {
    expect(parseInquiry(null).kind).toBe('invalid');
    expect(parseInquiry('hi').kind).toBe('invalid');
    expect(parseInquiry([good]).kind).toBe('invalid');
  });

  it('requires name, a valid email, a kind and a message', () => {
    expect(parseInquiry({ ...good, name: ' ' })).toEqual({ kind: 'invalid', error: 'Please add your name.' });
    expect(parseInquiry({ ...good, email: 'nope' })).toEqual({ kind: 'invalid', error: 'That email doesn’t look right.' });
    expect(parseInquiry({ ...good, kind: 'plumber' })).toEqual({ kind: 'invalid', error: 'Pick what kind of business you are.' });
    expect(parseInquiry({ ...good, kind: undefined })).toEqual({ kind: 'invalid', error: 'Pick what kind of business you are.' });
    expect(parseInquiry({ ...good, message: '' })).toEqual({ kind: 'invalid', error: 'Tell me a little about what you need.' });
  });

  it('caps lengths', () => {
    expect(parseInquiry({ ...good, message: 'x'.repeat(5001) }).kind).toBe('invalid');
    expect(parseInquiry({ ...good, name: 'x'.repeat(121) }).kind).toBe('invalid');
  });

  it('accepts a link without a scheme and drops a blank one', () => {
    const a = parseInquiry({ ...good, link: 'facebook.com/pats-candles' });
    expect(a.kind === 'ok' && a.fields.link).toBe('https://facebook.com/pats-candles');
    const b = parseInquiry({ ...good, link: '  ' });
    expect(b.kind === 'ok' && b.fields.link).toBeUndefined();
    const c = parseInquiry({ name: 'Pat', email: 'pat@example.com', kind: 'other', message: 'hi' });
    expect(c.kind === 'ok' && c.fields.link).toBeUndefined();
  });

  it('rejects a link that is not a web address', () => {
    expect(parseInquiry({ ...good, link: 'javascript:alert(1)' })).toEqual({ kind: 'invalid', error: 'That link doesn’t look right.' });
    expect(parseInquiry({ ...good, link: 'just some words' })).toEqual({ kind: 'invalid', error: 'That link doesn’t look right.' });
  });

  it('lowercases and trims the email', () => {
    const r = parseInquiry({ ...good, email: '  Pat@Example.COM ' });
    expect(r.kind === 'ok' && r.fields.email).toBe('pat@example.com');
  });
});

describe('parseInquiry — phone and best way to reach', () => {
  it('defaults to email and leaves the phone optional', () => {
    const r = parseInquiry(good);
    expect(r.kind === 'ok' && r.fields.contactBy).toBe('email');
    expect(r.kind === 'ok' && r.fields.phone).toBeUndefined();
  });

  it('needs a phone number for a call or a text', () => {
    expect(parseInquiry({ ...good, contactBy: 'call' })).toEqual({ kind: 'invalid', error: 'Add a phone number so I can call or text you.' });
    expect(parseInquiry({ ...good, contactBy: 'text', phone: ' ' })).toEqual({ kind: 'invalid', error: 'Add a phone number so I can call or text you.' });
    const r = parseInquiry({ ...good, contactBy: 'text', phone: '(401) 555-0100' });
    expect(r.kind === 'ok' && r.fields.phone).toBe('(401) 555-0100');
  });

  it('rejects a phone number with too few digits and an unknown way to reach', () => {
    expect(parseInquiry({ ...good, phone: '1-2-3-4-5-6' })).toEqual({ kind: 'invalid', error: 'That phone number doesn’t look right.' });
    expect(parseInquiry({ ...good, phone: '12' })).toEqual({ kind: 'invalid', error: 'That phone number doesn’t look right.' });
    expect(parseInquiry({ ...good, contactBy: 'pigeon' }).kind).toBe('invalid');
  });
});

describe('composeInquiryEmail', () => {
  it('labels every answer and names the kind of business in the subject', () => {
    const r = parseInquiry(good);
    if (r.kind !== 'ok') throw new Error('expected ok');
    const e = composeInquiryEmail(r.fields);
    expect(e.subject).toBe('New project: Pat Doe (Maker)');
    expect(e.text).toContain('Email: pat@example.com');
    expect(e.text).toContain('Link: https://instagram.com/pat');
    expect(e.text).toContain('Phone: —');
    expect(e.text).toContain('Best way to reach: Email');
    expect(e.text).toContain('I make candles and need a shop.');
  });

  it('escapes what the visitor typed in the html', () => {
    const r = parseInquiry({ ...good, name: '<b>Pat</b>', message: '<script>x</script>' });
    if (r.kind !== 'ok') throw new Error('expected ok');
    const { html } = composeInquiryEmail(r.fields);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;b&gt;Pat&lt;/b&gt;');
  });
});

describe('composeInquiryEmail — phone', () => {
  it('puts the phone and the preferred way to reach in the email and the subject', () => {
    const r = parseInquiry({ ...good, phone: '401-555-0100', contactBy: 'text' });
    if (r.kind !== 'ok') throw new Error('expected ok');
    const e = composeInquiryEmail(r.fields);
    expect(e.text).toContain('Phone: 401-555-0100');
    expect(e.text).toContain('Best way to reach: Text');
    expect(e.subject).toBe('New project: Pat Doe (Maker) · prefers a text');
  });
});

describe('parseInquiry — missing fields', () => {
  it('treats absent name, email and message as blank (first error is the name)', () => {
    expect(parseInquiry({ kind: 'maker' })).toEqual({ kind: 'invalid', error: 'Please add your name.' });
    expect(parseInquiry({ name: 'Pat', kind: 'maker', message: 'hi' })).toEqual({
      kind: 'invalid',
      error: 'That email doesn’t look right.',
    });
    expect(parseInquiry({ name: 'Pat', email: 'pat@example.com', kind: 'maker' })).toEqual({
      kind: 'invalid',
      error: 'Tell me a little about what you need.',
    });
  });

  it('treats a blank way-to-reach as the email default', () => {
    const r = parseInquiry({ ...good, contactBy: '' });
    expect(r.kind === 'ok' && r.fields.contactBy).toBe('email');
  });

  it('ignores a whitespace-only honeypot', () => {
    expect(parseInquiry({ ...good, company: '   ' }).kind).toBe('ok');
  });
});

describe('composeInquiryEmail — no link, phone call', () => {
  it('shows a dash for a missing link and names a phone-call preference', () => {
    const r = parseInquiry({ name: 'Pat', email: 'pat@example.com', kind: 'charity', message: 'a\nb', phone: '401 555 0100', contactBy: 'call' });
    if (r.kind !== 'ok') throw new Error('expected ok');
    const e = composeInquiryEmail(r.fields);
    expect(e.subject).toBe('New project: Pat (Charity or cause) · prefers a call');
    expect(e.text).toContain('Link: —');
    expect(e.text).toContain('Best way to reach: Phone call');
    expect(e.html).toContain('a<br />b');
  });
});

describe('the plan someone was looking at', () => {
  it('keeps a known plan and names it in the email and the subject', () => {
    const r = parseInquiry({ ...good, plan: 'maker-full' });
    expect(r.kind === 'ok' && r.fields.plan).toBe('maker-full');
    if (r.kind !== 'ok') throw new Error('expected ok');
    const email = composeInquiryEmail(r.fields);
    expect(email.text).toContain('Plan: Maker Full');
    expect(email.html).toContain('Maker Full');
    expect(email.subject).toContain('Maker Full');
  });

  it('drops an unknown or blank plan instead of refusing the message', () => {
    const a = parseInquiry({ ...good, plan: 'maker-pro' });
    expect(a.kind === 'ok' && a.fields.plan).toBeUndefined();
    const b = parseInquiry({ ...good, plan: '' });
    expect(b.kind === 'ok' && b.fields.plan).toBeUndefined();
    const c = parseInquiry({ ...good, plan: 42 });
    expect(c.kind === 'ok' && c.fields.plan).toBeUndefined();
  });

  it('says no plan was chosen when there is none', () => {
    const r = parseInquiry(good);
    if (r.kind !== 'ok') throw new Error('expected ok');
    const email = composeInquiryEmail(r.fields);
    expect(email.text).toContain('Plan: Not chosen');
    expect(email.subject).not.toContain('Not chosen');
  });
});
