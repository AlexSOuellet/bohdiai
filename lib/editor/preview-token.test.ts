import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

beforeEach(() => {
  process.env.PREVIEW_TOKEN_SECRET = 'test-secret';
  vi.useRealTimers();
});
afterEach(() => vi.useRealTimers());

import { mintPreviewToken, verifyPreviewToken } from './preview-token';

describe('preview token', () => {
  it('round-trips a tenant id', () => {
    const token = mintPreviewToken('tenant-123');
    expect(verifyPreviewToken(token)).toBe('tenant-123');
  });

  it('returns null for an empty/undefined token', () => {
    expect(verifyPreviewToken(undefined)).toBeNull();
    expect(verifyPreviewToken('')).toBeNull();
  });

  it('rejects a tampered token', () => {
    const token = mintPreviewToken('tenant-123');
    expect(verifyPreviewToken(token + 'x')).toBeNull();
  });

  it('rejects a token signed with a different secret', () => {
    const token = mintPreviewToken('tenant-123');
    process.env.PREVIEW_TOKEN_SECRET = 'other-secret';
    expect(verifyPreviewToken(token)).toBeNull();
  });

  it('rejects an expired token', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const token = mintPreviewToken('tenant-123');
    vi.setSystemTime(new Date('2026-01-01T00:20:00Z')); // 20 min later, past the 15-min TTL
    expect(verifyPreviewToken(token)).toBeNull();
  });
});
