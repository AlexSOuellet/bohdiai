import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * A short-lived, HMAC-signed token that proves "the owner's authenticated dashboard
 * authorised a draft preview for this tenant." It rides in the preview URL, so the
 * cross-subdomain preview iframe needs no shared cookie, and the public can never
 * forge one. Payload: `<tenantId>.<expiryMs>`, signed with PREVIEW_TOKEN_SECRET.
 * Spec: Project-Docs/Editor-Make-It-Yours-Design.md (Part 1).
 */

const TTL_MS = 15 * 60 * 1000; // 15 minutes — long enough for an editing pass, short enough to expire.

function secret(): string {
  const s = process.env['PREVIEW_TOKEN_SECRET'];
  if (!s) throw new Error('PREVIEW_TOKEN_SECRET is not set');
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

/** Mint a token authorising a draft preview for `tenantId`, valid for TTL_MS. */
export function mintPreviewToken(tenantId: string): string {
  const payload = `${tenantId}.${Date.now() + TTL_MS}`;
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`;
}

/** Verify a token; return the tenantId when valid and unexpired, else null. */
export function verifyPreviewToken(token: string | undefined): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let payload: string;
  try {
    payload = Buffer.from(body, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [tenantId, expiryStr] = payload.split('.');
  const expiry = Number(expiryStr);
  if (!tenantId || !Number.isFinite(expiry) || Date.now() > expiry) return null;
  return tenantId;
}
