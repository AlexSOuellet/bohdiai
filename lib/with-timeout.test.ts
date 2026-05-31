import { describe, it, expect } from 'vitest';
import { withTimeout, TimeoutError } from './with-timeout';

describe('withTimeout', () => {
  it('rejects with a TimeoutError when the promise does not settle in time', async () => {
    const never = new Promise<string>(() => {});
    await expect(withTimeout(never, 10, 'fal image')).rejects.toBeInstanceOf(TimeoutError);
  });

  it('names the label and the duration in the timeout error', async () => {
    const never = new Promise<string>(() => {});
    await expect(withTimeout(never, 10, 'fal image')).rejects.toThrow(/fal image.*10ms/);
  });

  it('resolves with the value when the promise settles before the timeout', async () => {
    await expect(withTimeout(Promise.resolve('done'), 50, 'quick')).resolves.toBe('done');
  });

  it('propagates the original rejection when the promise rejects before the timeout', async () => {
    await expect(
      withTimeout(Promise.reject(new Error('upstream failure')), 50, 'boom'),
    ).rejects.toThrow('upstream failure');
  });
});
