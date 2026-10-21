/**
 * Scrambling for the Square keys (AES-GCM, Web Crypto). The secret lives only in
 * Cloudflare (SQUARE_TOKEN_KEY), so the database alone never holds a usable key.
 * Stored form: base64 of a fresh 12-byte iv followed by the ciphertext.
 */

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

async function aesKey(secretB64: string): Promise<CryptoKey> {
  const raw = fromBase64(secretB64);
  if (raw.length !== 32) throw new Error('SQUARE_TOKEN_KEY must be 32 bytes, base64');
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function seal(plain: string, secretB64: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(secretB64), new TextEncoder().encode(plain)));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv);
  out.set(ct, iv.length);
  return toBase64(out);
}

/** The key back; throws when it was tampered with or scrambled under another secret. */
export async function unseal(sealed: string, secretB64: string): Promise<string> {
  const all = fromBase64(sealed);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.slice(0, 12) }, await aesKey(secretB64), all.slice(12));
  return new TextDecoder().decode(plain);
}

/** A short signed note (HMAC-SHA256 under the same secret, its own purpose): the
 *  Connect step's state and a card sale's details ride through Square and come
 *  back unchanged, or are refused. */
async function macKey(secretB64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', fromBase64(secretB64), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function urlSafe(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromUrlSafe(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  return b64 + '='.repeat((4 - (b64.length % 4)) % 4);
}

export async function signNote(purpose: string, payload: unknown, secretB64: string): Promise<string> {
  const body = urlSafe(toBase64(new TextEncoder().encode(JSON.stringify(payload))));
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', await macKey(secretB64), new TextEncoder().encode(`${purpose}.${body}`)));
  return `${body}.${urlSafe(toBase64(mac))}`;
}

/** The payload, or null when the note was changed, is for another purpose or is malformed. */
export async function readNote(purpose: string, note: string, secretB64: string): Promise<unknown> {
  const [body, mac, extra] = note.split('.');
  if (body === undefined || mac === undefined || extra !== undefined) return null;
  try {
    const ok = await crypto.subtle.verify('HMAC', await macKey(secretB64), fromBase64(fromUrlSafe(mac)), new TextEncoder().encode(`${purpose}.${body}`));
    if (!ok) return null;
    return JSON.parse(new TextDecoder().decode(fromBase64(fromUrlSafe(body))));
  } catch {
    return null;
  }
}
