import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the SDK before importing the module under test.
const ctorSpy = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      constructor(opts: Record<string, unknown>) {
        ctorSpy(opts);
      }
    },
  };
});

// Mock env so the wrapper does not blow up when process.env is partial.
let env: { BOHDIAI_ANTHROPIC_KEY?: string } = { BOHDIAI_ANTHROPIC_KEY: 'test-key-123' };
vi.mock('./env', () => ({
  serverEnv: () => env,
}));

describe('anthropicClient', () => {
  beforeEach(() => {
    ctorSpy.mockClear();
    env = { BOHDIAI_ANTHROPIC_KEY: 'test-key-123' };
    // Reset the module-level cache so each test reconstructs.
    vi.resetModules();
  });

  it('constructs the SDK client with the env-derived API key and Anthropic base URL', async () => {
    const { anthropicClient } = await import('./anthropic');
    const client = anthropicClient();
    expect(client).toBeDefined();
    expect(ctorSpy).toHaveBeenCalledTimes(1);
    expect(ctorSpy).toHaveBeenCalledWith({
      apiKey: 'test-key-123',
      baseURL: 'https://api.anthropic.com',
    });
  });

  it('refuses plainly, naming the key, when the AI key is not set', async () => {
    env = {};
    const { anthropicClient } = await import('./anthropic');
    expect(() => anthropicClient()).toThrow(/BOHDIAI_ANTHROPIC_KEY is not set/);
    expect(ctorSpy).not.toHaveBeenCalled();
  });

  it('memoizes the client across calls — the SDK is only constructed once', async () => {
    const { anthropicClient } = await import('./anthropic');
    const a = anthropicClient();
    const b = anthropicClient();
    expect(a).toBe(b);
    expect(ctorSpy).toHaveBeenCalledTimes(1);
  });
});
