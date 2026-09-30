import { describe, it, expect, vi } from 'vitest';
import { confirmUrl, composeAuthEmail, createAuthLink, sendAuthEmail, sendAuthLink, type AuthLinkKind } from './auth-links';

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
    expect(e.text).toContain('The link works once and expires in an hour.');
    expect(e.html).toContain('The link works once and expires in an hour.');
    expect(e.text + e.html).not.toContain('24 hours');
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

describe('createAuthLink', () => {
  it('returns the confirm link and the user id, without sending anything', async () => {
    const generateLink = vi.fn(async () => ({ data: { properties: { hashed_token: 'tok' }, user: { id: 'u1' } }, error: null }));
    const out = await createAuthLink({ kind: 'invite', email: 'a@b.co', appOrigin: 'https://app.x', generateLink });
    expect(generateLink).toHaveBeenCalledWith({ type: 'invite', email: 'a@b.co' });
    expect(out.userId).toBe('u1');
    expect(new URL(out.link).searchParams.get('token_hash')).toBe('tok');
  });

  it('has a null user id when the generator does not report one', async () => {
    const generateLink = vi.fn(async () => ({ data: { properties: { hashed_token: 't' } }, error: null }));
    expect((await createAuthLink({ kind: 'recovery', email: 'a@b.co', appOrigin: 'https://app.x', generateLink })).userId).toBeNull();
  });

  it('throws when the link cannot be made', async () => {
    const generateLink = vi.fn(async () => ({ data: null, error: { message: 'nope' } }));
    await expect(createAuthLink({ kind: 'invite', email: 'a@b.co', appOrigin: 'https://app.x', generateLink })).rejects.toThrow(
      'Could not create the sign-in link: nope',
    );
  });
});

describe('sendAuthEmail', () => {
  it('sends the composed email with the given link', async () => {
    const send = vi.fn(async () => ({ error: null }));
    await sendAuthEmail({ kind: 'invite', email: 'a@b.co', siteName: 'S', link: 'https://app.x/l', send });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@b.co', text: expect.stringContaining('https://app.x/l') }));
  });

  it('throws when the email does not send', async () => {
    const send = vi.fn(async () => ({ error: { message: 'resend down' } }));
    await expect(sendAuthEmail({ kind: 'invite', email: 'a@b.co', siteName: 'S', link: 'l', send })).rejects.toThrow(
      'Could not send the email: resend down',
    );
  });
});
