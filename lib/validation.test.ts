import { describe, expect, it } from 'vitest';
import { waitlistSchema, resendSchema } from './validation';

describe('waitlistSchema', () => {
  it('accepts a valid founder signup', () => {
    const result = waitlistSchema.safeParse({ email: 'alex@example.com', type: 'founder' });
    expect(result.success).toBe(true);
  });

  it('accepts a valid notify signup', () => {
    const result = waitlistSchema.safeParse({ email: 'alex@example.com', type: 'notify' });
    expect(result.success).toBe(true);
  });

  it('lowercases and trims email', () => {
    const result = waitlistSchema.safeParse({ email: '  ALEX@Example.COM  ', type: 'notify' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('alex@example.com');
    }
  });

  it('rejects an invalid email', () => {
    const result = waitlistSchema.safeParse({ email: 'not-an-email', type: 'founder' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty email', () => {
    const result = waitlistSchema.safeParse({ email: '', type: 'founder' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown type', () => {
    const result = waitlistSchema.safeParse({ email: 'alex@example.com', type: 'admin' });
    expect(result.success).toBe(false);
  });

  it('rejects email longer than 254 chars', () => {
    const longLocal = 'a'.repeat(250);
    const result = waitlistSchema.safeParse({
      email: `${longLocal}@example.com`,
      type: 'notify',
    });
    expect(result.success).toBe(false);
  });
});

describe('resendSchema', () => {
  it('accepts a valid email', () => {
    const result = resendSchema.safeParse({ email: 'alex@example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = resendSchema.safeParse({ email: 'nope' });
    expect(result.success).toBe(false);
  });
});
