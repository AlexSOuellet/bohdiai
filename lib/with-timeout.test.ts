import { describe, it, expect, vi } from 'vitest';
import { withTimeout, TimeoutError } from './with-timeout';

describe('withTimeout', () => {
  it('rejects with a TimeoutError when the factory promise does not settle in time', async () => {
    await expect(
      withTimeout(() => new Promise<string>(() => {}), 10, 'fal image'),
    ).rejects.toBeInstanceOf(TimeoutError);
  });

  it('names the label and the duration in the timeout error', async () => {
    await expect(
      withTimeout(() => new Promise<string>(() => {}), 10, 'fal image'),
    ).rejects.toThrow(/fal image.*10ms/);
  });

  it('resolves with the value when the factory promise settles before the timeout', async () => {
    await expect(withTimeout(() => Promise.resolve('done'), 50, 'quick')).resolves.toBe('done');
  });

  it('propagates the original rejection when the factory promise rejects before the timeout', async () => {
    await expect(
      withTimeout(() => Promise.reject(new Error('upstream failure')), 50, 'boom'),
    ).rejects.toThrow('upstream failure');
  });

  it('hands the factory an AbortSignal it can pass through to fetch / anthropic / fal', async () => {
    const factory = vi.fn((signal: AbortSignal) => {
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal.aborted).toBe(false);
      return Promise.resolve('done');
    });
    await withTimeout(factory, 50, 'signal check');
    expect(factory).toHaveBeenCalledOnce();
  });

  it('aborts the signal on timeout — the underlying call actually cancels instead of running invisibly to completion', async () => {
    let captured: AbortSignal | null = null;
    const promise = withTimeout(
      (signal) => {
        captured = signal;
        return new Promise<string>(() => {});
      },
      10,
      'aborting call',
    );
    await expect(promise).rejects.toBeInstanceOf(TimeoutError);
    expect(captured!.aborted).toBe(true);
  });

  it('does NOT abort the signal on a successful settle', async () => {
    let captured: AbortSignal | null = null;
    await withTimeout(
      (signal) => {
        captured = signal;
        return Promise.resolve('done');
      },
      50,
      'happy path',
    );
    expect(captured!.aborted).toBe(false);
  });

  it('catches a synchronous throw from the factory and rejects with it (no orphan pending timer)', async () => {
    await expect(
      withTimeout(() => {
        throw new Error('bad setup');
      }, 50, 'setup boom'),
    ).rejects.toThrow('bad setup');
  });
});
