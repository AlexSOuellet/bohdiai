/**
 * The link in a free site's invite (Alex, 2026-11-06: an invite has no time limit).
 * Supabase's own links expire, so this one is ours: the account's id, signed with
 * the server's secret. It never expires, and it stops working the moment the maker
 * sets a password, which clears INVITE_OPEN on the account. A signature proves the
 * link is ours; INVITE_OPEN decides whether it still opens anything.
 */
export const INVITE_OPEN = 'invite_open';

const PURPOSE = 'bohdiai-invite:';

const key = (secret: string, use: 'sign' | 'verify'): Promise<CryptoKey> => crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [use]);

const toHex = (bytes: ArrayBuffer): string => Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');

export async function inviteToken(secret: string, userId: string): Promise<string> {
  const signature = await crypto.subtle.sign('HMAC', await key(secret, 'sign'), new TextEncoder().encode(PURPOSE + userId));
  return `${userId}.${toHex(signature)}`;
}

/** The account a token names, or null when it isn't one we signed. */
export async function readInviteToken(secret: string, token: string): Promise<string | null> {
  const [userId, signature, extra] = token.split('.');
  if (userId === undefined || signature === undefined || extra !== undefined || !/^[0-9a-f]{64}$/.test(signature)) return null;
  const bytes = Uint8Array.from(signature.match(/../g) ?? [], (pair) => parseInt(pair, 16));
  const good = await crypto.subtle.verify('HMAC', await key(secret, 'verify'), bytes, new TextEncoder().encode(PURPOSE + userId));
  return good ? userId : null;
}

export function inviteUrl(appBase: string, token: string): string {
  const url = new URL('/auth/invite', appBase);
  url.searchParams.set('t', token);
  return url.toString();
}
