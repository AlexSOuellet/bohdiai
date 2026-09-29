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

describe('composeInquiryEmail', () => {
  it('labels every answer and names the kind of business in the subject', () => {
    const r = parseInquiry(good);
    if (r.kind !== 'ok') throw new Error('expected ok');
    const e = composeInquiryEmail(r.fields);
    expect(e.subject).toBe('New project: Pat Doe (Maker)');
    expect(e.text).toContain('Email: pat@example.com');
    expect(e.text).toContain('Link: https://instagram.com/pat');
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
