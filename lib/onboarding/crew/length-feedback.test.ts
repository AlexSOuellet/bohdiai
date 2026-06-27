import { describe, it, expect } from 'vitest';
import type { z } from 'zod';
import { valueAtPath, lengthAwareIssues, isLengthOnly, buildResubmitPayload } from './length-feedback';

type Issue = {
  code: string;
  type?: string;
  path: Array<string | number>;
  message: string;
  maximum?: number;
  minimum?: number;
};
const err = (issues: Issue[]): z.ZodError => ({ issues } as unknown as z.ZodError);

describe('valueAtPath', () => {
  it('walks a nested path to its value', () => {
    expect(valueAtPath({ products: [{ description: 'hi' }] }, ['products', 0, 'description'])).toBe('hi');
  });

  it('returns undefined when the path runs off a non-object', () => {
    expect(valueAtPath({ a: 1 }, ['a', 'b'])).toBeUndefined();
    expect(valueAtPath(null, ['a'])).toBeUndefined();
  });
});

describe('lengthAwareIssues', () => {
  const input = {
    products: [{ description: 'x'.repeat(95) }],
    moment: { eyebrow: 'ab' },
    count: 5,
  };

  it('reports the real length and characters to cut for a too_big string', () => {
    const out = lengthAwareIssues(
      err([{ code: 'too_big', type: 'string', path: ['products', 0, 'description'], maximum: 90, message: 'too big' }]),
      input,
    );
    expect(out[0]!.path).toBe('products.0.description');
    expect(out[0]!.message).toContain('is 95 characters');
    expect(out[0]!.message).toContain('cut at least 5');
  });

  it('reports the characters to add for a too_small string', () => {
    const out = lengthAwareIssues(
      err([{ code: 'too_small', type: 'string', path: ['moment', 'eyebrow'], minimum: 5, message: 'too small' }]),
      input,
    );
    expect(out[0]!.message).toContain('is 2 characters');
    expect(out[0]!.message).toContain('add at least 3');
  });

  it('passes through length issues that point at a non-string value', () => {
    const out = lengthAwareIssues(
      err([{ code: 'too_big', type: 'string', path: ['count'], maximum: 3, message: 'stock message' }]),
      input,
    );
    expect(out[0]!.message).toBe('stock message');
  });

  it('passes through non-length issues unchanged', () => {
    const out = lengthAwareIssues(err([{ code: 'invalid_type', path: ['x'], message: 'expected string' }]), input);
    expect(out[0]).toEqual({ path: 'x', message: 'expected string' });
  });
});

describe('isLengthOnly', () => {
  it('is false for an empty issue list', () => {
    expect(isLengthOnly(err([]))).toBe(false);
  });

  it('is true when every issue is a string length-cap violation', () => {
    expect(
      isLengthOnly(
        err([
          { code: 'too_big', type: 'string', path: ['a'], message: '' },
          { code: 'too_small', type: 'string', path: ['b'], message: '' },
        ]),
      ),
    ).toBe(true);
  });

  it('is false when any issue is not a string length violation', () => {
    expect(
      isLengthOnly(
        err([
          { code: 'too_big', type: 'string', path: ['a'], message: '' },
          { code: 'invalid_type', path: ['b'], message: '' },
        ]),
      ),
    ).toBe(false);
  });
});

describe('buildResubmitPayload', () => {
  it('adds the byte-for-byte resubmit instruction on a length-only failure', () => {
    const out = buildResubmitPayload(
      err([{ code: 'too_big', type: 'string', path: ['a'], maximum: 3, message: '' }]),
      { a: 'toolong' },
    );
    expect(out.ok).toBe(false);
    expect(out.instruction).toContain('Resubmit your previous draft');
  });

  it('omits the instruction when the failure is not length-only', () => {
    const out = buildResubmitPayload(err([{ code: 'invalid_type', path: ['a'], message: 'bad' }]), { a: 1 });
    expect(out.instruction).toBeUndefined();
    expect(out.issues[0]!.message).toBe('bad');
  });
});
