import { describe, it, expect, vi } from 'vitest';

vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'cf-connecting-ip': '203.0.113.9' }) }));

import { allowAction } from './action-limit';

function limiter(success: boolean): RateLimit {
  return { limit: vi.fn(async () => ({ success })) } as unknown as RateLimit;
}

describe('allowAction', () => {
  it('keys the limiter by action and visitor', async () => {
    const l = limiter(true);
    expect(await allowAction('signin', l)).toBe('allowed');
    expect(l.limit).toHaveBeenCalledWith({ key: 'signin:203.0.113.9' });
  });
  it('reports limited', async () => {
    expect(await allowAction('reset', limiter(false))).toBe('limited');
  });
  it('fails closed when the limiter throws', async () => {
    const broken = { limit: vi.fn(async () => { throw new Error('down'); }) } as unknown as RateLimit;
    expect(await allowAction('signin', broken)).toBe('unavailable');
  });
});
