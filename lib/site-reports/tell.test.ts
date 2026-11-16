import { describe, it, expect } from 'vitest';
import { reportEmail } from './tell';

describe('Alex’s email for a report (go-live step 3)', () => {
  it('says which site, why, what they said, how to reply, and links straight to Suspend', () => {
    const mail = reportEmail({
      siteName: 'Rustic Charm',
      subdomain: 'rustic-charm',
      tenantId: 't1',
      reason: 'mine',
      details: 'Those are my photos.',
      email: 'me@example.com',
    });
    expect(mail.subject).toBe('Report: Rustic Charm (My photos or my work)');
    expect(mail.text).toContain('rustic-charm.bohdiai.com');
    expect(mail.text).toContain('Those are my photos.');
    expect(mail.text).toContain('Their email, for a reply: me@example.com');
    expect(mail.text).toContain('https://app.bohdiai.com/founder/act/t1#suspend');
  });
  it('says when they left no email', () => {
    expect(
      reportEmail({
        siteName: 'A',
        subdomain: 'a',
        tenantId: 't',
        reason: 'other',
        details: 'x',
        email: '',
      }).text,
    ).toContain('They left no email.');
  });
});
