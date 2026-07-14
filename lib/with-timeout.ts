// Races a factory-produced promise against a deadline. On timeout, the returned
// promise rejects with a TimeoutError AND the AbortSignal handed to the factory
// is aborted — so the underlying HTTP call (Anthropic messages, fal subscribe)
// actually CANCELS instead of running to completion in the background while
// retries queue on top of it (audit HIGH: "withTimeout rejects but never aborts
// the underlying Anthropic/fal call — under retry pressure, timed-out calls
// keep running").
//
// The factory shape (a function that receives a signal) is required because a
// raw Promise has no way to accept an abort signal after it has been created —
// the signal has to be part of the request that starts the work.

export class TimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`${label} timed out after ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

/** Race a fetch-shaped operation against a deadline. The factory receives an
 *  AbortSignal it MUST pass through to whatever it calls (Anthropic:
 *  `client.messages.create(body, { signal })`; fal: `subscribe(endpoint,
 *  { input, abortSignal: signal })`; native fetch: `fetch(url, { signal })`).
 *  If the factory ignores the signal, the timeout still rejects, but the
 *  underlying work continues running invisibly — defeats the audit fix. */
export function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  const controller = new AbortController();
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError(label, ms));
    }, ms);
    let promise: Promise<T>;
    try {
      promise = fn(controller.signal);
    } catch (err) {
      clearTimeout(timer);
      reject(err instanceof Error ? err : new Error(String(err)));
      return;
    }
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      },
    );
  });
}
