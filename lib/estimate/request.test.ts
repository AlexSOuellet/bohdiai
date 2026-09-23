import { describe, it, expect } from 'vitest';
import { parseEstimateForm, composeEstimateEmail, MAX_ESTIMATE_PHOTOS } from './request';

const TENANT = '4b8f0f5e-8f3a-4a57-9a8e-1f2d3c4b5a69';

function form(fields: Record<string, string | string[]>, photos: File[] = []): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    for (const item of Array.isArray(v) ? v : [v]) f.append(k, item);
  }
  for (const p of photos) f.append('photos', p);
  return f;
}

const jpg = (bytes = 10, name = 'yard.jpg') => new File([new Uint8Array(bytes)], name, { type: 'image/jpeg' });

describe('parseEstimateForm', () => {
  it('treats a filled honeypot as spam', () => {
    expect(parseEstimateForm(form({ tenantId: TENANT, name: 'Bot', phone: '1', company: 'ACME' }))).toEqual({ kind: 'spam' });
  });

  it('requires a name', () => {
    const r = parseEstimateForm(form({ tenantId: TENANT, name: ' ', phone: '401' }));
    expect(r).toEqual({ kind: 'invalid', error: 'Please add your name.' });
  });

  it('requires a phone or an email', () => {
    const r = parseEstimateForm(form({ tenantId: TENANT, name: 'Pat' }));
    expect(r.kind).toBe('invalid');
  });

  it('rejects a malformed email', () => {
    const r = parseEstimateForm(form({ tenantId: TENANT, name: 'Pat', email: 'not-an-email' }));
    expect(r).toEqual({ kind: 'invalid', error: 'That email doesn’t look right.' });
  });

  it('rejects too many photos, wrong types, and oversize photos', () => {
    const base = { tenantId: TENANT, name: 'Pat', phone: '401' };
    const many = Array.from({ length: MAX_ESTIMATE_PHOTOS + 1 }, () => jpg());
    expect(parseEstimateForm(form(base, many)).kind).toBe('invalid');
    expect(parseEstimateForm(form(base, [new File(['x'], 'a.gif', { type: 'image/gif' })])).kind).toBe('invalid');
    expect(parseEstimateForm(form(base, [jpg(16 * 1024 * 1024 + 1)])).kind).toBe('invalid');
  });

  it('accepts a full request with services and photos', () => {
    const r = parseEstimateForm(form(
      { tenantId: TENANT, name: 'Pat Doe', phone: '(401) 555-0100', email: 'pat@example.com', town: 'Warwick', state: 'Rhode Island', details: 'Back yard', services: ['New sod installs', 'Grading'] },
      [jpg(), jpg()],
    ));
    expect(r.kind).toBe('ok');
    if (r.kind !== 'ok') return;
    expect(r.fields.services).toEqual(['New sod installs', 'Grading']);
    expect(r.fields.town).toBe('Warwick');
    expect(r.photos).toHaveLength(2);
  });

  it('turns blank optional fields into absent ones', () => {
    const r = parseEstimateForm(form({ tenantId: TENANT, name: 'Pat', phone: '401', email: '', town: '  ' }));
    expect(r.kind).toBe('ok');
    if (r.kind !== 'ok') return;
    expect(r.fields.email).toBeUndefined();
    expect(r.fields.town).toBeUndefined();
  });
});

describe('composeEstimateEmail', () => {
  it('labels every answer and escapes html', () => {
    const e = composeEstimateEmail(
      { tenantId: TENANT, name: '<b>Pat</b>', phone: '401', email: undefined, town: 'Warwick', state: 'RI', details: 'line1\nline2', services: ['Grading'] },
      'Cut-Pro',
      2,
    );
    expect(e.subject).toBe('Estimate request: <b>Pat</b> — Warwick, RI');
    expect(e.html).toContain('&lt;b&gt;Pat&lt;/b&gt;');
    expect(e.html).not.toContain('<b>Pat</b>');
    expect(e.html).toContain('line1<br />line2');
    expect(e.text).toContain('Photos: 2 attached');
    expect(e.text).toContain('Needs: Grading');
  });
});
