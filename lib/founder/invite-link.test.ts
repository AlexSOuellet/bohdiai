import { describe, expect, it } from 'vitest';
import { inviteToken, inviteUrl, readInviteToken } from './invite-link';

const SECRET = 'a-secret-that-is-long-enough-to-trust-here';

describe('the invite link', () => {
  it('reads back the account it was made for', async () => {
    expect(await readInviteToken(SECRET, await inviteToken(SECRET, 'user-1'))).toBe('user-1');
  });
  it('turns away a link signed with another secret', async () => {
    expect(await readInviteToken('another-secret-entirely-long-enough-here', await inviteToken(SECRET, 'user-1'))).toBeNull();
  });
  it('turns away a link changed to name someone else', async () => {
    const [, signature] = (await inviteToken(SECRET, 'user-1')).split('.');
    expect(await readInviteToken(SECRET, `user-2.${signature}`)).toBeNull();
  });
  it.each(['', 'user-1', 'user-1.abc', 'user-1.zz', `user-1.${'0'.repeat(64)}`, `user-1.${'0'.repeat(64)}.more`])('turns away %j', async (token) => {
    expect(await readInviteToken(SECRET, token)).toBeNull();
  });
  it('makes the address on the app host', () => {
    expect(inviteUrl('https://app.bohdiai.com', 'u.abc')).toBe('https://app.bohdiai.com/auth/invite?t=u.abc');
  });
});
