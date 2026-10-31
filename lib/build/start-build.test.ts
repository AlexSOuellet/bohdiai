// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const env: { SITE_BUILD?: { create: ReturnType<typeof vi.fn> } } = {};
const after = vi.fn();
const runSequence = vi.fn();
vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext: async () => ({ env }) }));
vi.mock('next/server', () => ({ after: (fn: () => unknown) => after(fn) }));
vi.mock('./build-sequence', () => ({ runSequence: (...a: unknown[]) => runSequence(...a) }));
vi.mock('./run-step', () => ({ runStep: vi.fn(), buildDeps: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

import { buildId, isStepInput, startBuild } from './start-build';

beforeEach(() => {
  delete env.SITE_BUILD;
  after.mockReset();
  runSequence.mockReset().mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe('startBuild', () => {
  it('starts the Cloudflare Workflow, one build per form', async () => {
    env.SITE_BUILD = { create: vi.fn(async () => ({})) };
    await startBuild('i1');
    expect(env.SITE_BUILD.create).toHaveBeenCalledWith({ id: 'site-i1', params: { intakeId: 'i1' } });
    expect(after).not.toHaveBeenCalled();
  });

  it('on the dev server, runs the steps in turn after the form is answered', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    await startBuild('i1');
    expect(after).toHaveBeenCalledTimes(1);
    await (after.mock.calls[0]?.[0] as () => Promise<void>)();
    expect(runSequence).toHaveBeenCalledWith('i1', expect.any(Function));
  });

  it('fails loudly live if the Workflow isn’t set up, rather than half-running', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    await expect(startBuild('i1')).rejects.toThrow(/SITE_BUILD/);
    expect(after).not.toHaveBeenCalled();
  });
});

describe('isStepInput', () => {
  it('knows the build’s steps', () => {
    expect(isStepInput({ step: 'draft', state: {} })).toBe(true);
    expect(isStepInput({ step: 'drop' })).toBe(false);
    expect(isStepInput(null)).toBe(false);
  });
});

describe('buildId', () => {
  it('names the build after its form', () => {
    expect(buildId('abc')).toBe('site-abc');
  });
});
