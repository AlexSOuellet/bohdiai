import { describe, it, expect, vi } from 'vitest';
import { confirmUrl, composeAuthEmail, sendAuthLink, type AuthLinkKind } from './auth-links';

describe('confirmUrl', () => {
  it('points at /auth/confirm on the app host with the token and kind', () => {
    const u = new URL(confirmUrl('https://app.bohdiai.com', 'abc123', 'invite'));
    expect(u.origin + u.pathname).toBe('https://app.bohdiai.com/auth/confirm');
    expect(u.searchParams.get('token_hash')).toBe('abc123');
    expect(u.searchParams.get('type')).toBe('invite');
  });
});

describe('composeAuthEmail', () => {
  it.each<[AuthLinkKind, RegExp]>([
    ['invite', /set your password/i],
    ['recovery', /reset your password/i],
  ])('%s email names the site and carries the link', (kind, words) => {
    const e = composeAuthEmail({ kind, siteName: 'Classic Loafs', link: 'https://app.bohdiai.com/auth/confirm?x=1' });
    expect(e.subject).toContain('Classic Loafs');
    expect(e.text).toMatch(words);
    expect(e.text).toContain('https://app.bohdiai.com/auth/confirm?x=1');
    expect(e.html).toContain('href="https://app.bohdiai.com/auth/confirm?x=1"');
  });

  it('escapes the site name in html', () => {
    const e = composeAuthEmail({ kind: 'invite', siteName: '<b>X</b>', link: 'https://a/b' });
    expect(e.html).not.toContain('<b>X</b>');
  });
});

describe('sendAuthLink', () => {
  it('generates the link, then sends it to the email', async () => {
    const generateLink = vi.fn(async () => ({ data: { properties: { hashed_token: 'tok' } }, error: null }));
    const send = vi.fn(async () => ({ error: null }));
    await sendAuthLink({
      kind: 'invite',
      email: 'maker@example.com',
      siteName: 'Classic Loafs',
      appOrigin: 'https://app.bohdiai.com',
      generateLink,
      send,
    });
    expect(generateLink).toHaveBeenCalledWith({ type: 'invite', email: 'maker@example.com' });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: 'maker@example.com' }));
  });

  it('throws when the link cannot be made', async () => {
    const generateLink = vi.fn(async () => ({ data: null, error: { message: 'nope' } }));
    await expect(
      sendAuthLink({ kind: 'recovery', email: 'a@b.co', siteName: 'S', appOrigin: 'https://app.x', generateLink, send: vi.fn() }),
    ).rejects.toThrow('Could not create the sign-in link: nope');
  });

  it('throws when the email does not send', async () => {
    const generateLink = vi.fn(async () => ({ data: { properties: { hashed_token: 't' } }, error: null }));
    const send = vi.fn(async () => ({ error: { message: 'resend down' } }));
    await expect(
      sendAuthLink({ kind: 'invite', email: 'a@b.co', siteName: 'S', appOrigin: 'https://app.x', generateLink, send }),
    ).rejects.toThrow('Could not send the email: resend down');
  });
});
