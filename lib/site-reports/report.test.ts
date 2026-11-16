import { describe, it, expect } from 'vitest';
import { parseReport, reportPageUrl, siteName, REPORT_FIELD } from './report';

const good = {
  [REPORT_FIELD.site]: 'rustic-charm',
  [REPORT_FIELD.reason]: 'scam',
  [REPORT_FIELD.details]: ' Took my money, never shipped. ',
  [REPORT_FIELD.email]: ' Me@Example.com ',
};

describe('parseReport (go-live step 3, Alex 2026-11-16)', () => {
  it('takes the site, why, the details and an optional email', () => {
    expect(parseReport(good)).toEqual({
      kind: 'ok',
      fields: {
        site: 'rustic-charm',
        reason: 'scam',
        details: 'Took my money, never shipped.',
        email: 'me@example.com',
      },
    });
    expect(parseReport({ ...good, email: '' })).toMatchObject({
      kind: 'ok',
      fields: { email: '' },
    });
  });
  it('names the first thing wrong', () => {
    expect(parseReport({ ...good, site: 'not a site!' })).toEqual({
      kind: 'invalid',
      problem: 'site',
    });
    expect(parseReport({ ...good, reason: 'boring' })).toEqual({
      kind: 'invalid',
      problem: 'reason',
    });
    expect(parseReport({ ...good, details: '  ' })).toEqual({
      kind: 'invalid',
      problem: 'details',
    });
    expect(parseReport({ ...good, details: 'x'.repeat(2001) })).toEqual({
      kind: 'invalid',
      problem: 'tooLong',
    });
    expect(parseReport({ ...good, email: 'nope' })).toEqual({ kind: 'invalid', problem: 'email' });
    expect(parseReport(null)).toEqual({ kind: 'invalid', problem: 'site' });
  });
  it('treats a filled hidden field as a bot', () => {
    expect(parseReport({ ...good, company: 'Acme' })).toEqual({ kind: 'spam' });
  });
});

describe('siteName', () => {
  it('reads a name, a host or a whole address', () => {
    expect(siteName('Rustic-Charm')).toBe('rustic-charm');
    expect(siteName('https://rustic-charm.bohdiai.com/shop?x=1')).toBe('rustic-charm');
    expect(siteName('rustic-charm.localhost:3000')).toBe('rustic-charm');
    expect(siteName('')).toBeNull();
    expect(siteName('evil.example.com')).toBeNull();
  });
});

describe('reportPageUrl', () => {
  it('goes to bohdiai.com live, and to the dev server on this computer', () => {
    expect(reportPageUrl('rustic-charm.bohdiai.com', 'https:', 'rustic-charm')).toBe(
      'https://bohdiai.com/report?site=rustic-charm',
    );
    expect(reportPageUrl('rustic-charm.localhost:3000', 'http:', 'rustic-charm')).toBe(
      'http://localhost:3000/report?site=rustic-charm',
    );
  });
});
