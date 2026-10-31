// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const runStep = vi.fn();
const buildDeps = vi.fn(() => ({}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/build/run-step', () => ({ runStep: (...a: unknown[]) => runStep(...a), buildDeps: () => buildDeps() }));
vi.mock('@/lib/build/start-build', async () => {
  const STEPS = new Set(['prepare', 'plan', 'background', 'draft', 'write', 'finish', 'attach', 'failed']);
  return { BUILD_JOB: 'site-build', isStepInput: (v: { step?: string }) => typeof v?.step === 'string' && STEPS.has(v.step) };
});

import { POST } from './route';
import { CRON_KEY_HEADER, cronKey } from '@/lib/visits/cron-key';

const SECRET = 'a-test-secret-that-is-at-least-32-characters';
async function post(body: unknown, key?: string | null): Promise<Response> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const k = key === undefined ? await cronKey(SECRET, 'site-build') : key;
  if (k !== null) headers[CRON_KEY_HEADER] = k;
  return POST(new Request('https://bohdiai.com/api/build/step', { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) }));
}

describe('POST /api/build/step', () => {
  beforeEach(() => {
    vi.stubEnv('BACKEND_SESSION_SECRET', SECRET);
    runStep.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it('runs one step and answers what it gave back', async () => {
    runStep.mockResolvedValue({ family: 'rustic' });
    const res = await post({ step: 'prepare', intakeId: 'i1' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ result: { family: 'rustic' } });
    expect(runStep).toHaveBeenCalledWith({}, { step: 'prepare', intakeId: 'i1' });
  });

  it('turns away a request without the build’s key, before anything runs', async () => {
    expect((await post({ step: 'prepare', intakeId: 'i1' }, null)).status).toBe(403);
    expect((await post({ step: 'prepare', intakeId: 'i1' }, await cronKey(SECRET, 'visit-months'))).status).toBe(403);
    expect(runStep).not.toHaveBeenCalled();
  });

  it('turns away something that isn’t a step', async () => {
    expect((await post({ step: 'delete-everything' })).status).toBe(400);
    expect((await post('nope')).status).toBe(400);
    expect(runStep).not.toHaveBeenCalled();
  });

  it('answers 500 when the step fails, so the Workflow tries again', async () => {
    runStep.mockRejectedValue(new Error('claude busy'));
    const res = await post({ step: 'draft', state: {} });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'claude busy' });
  });

  it('answers null for a step with nothing to give back', async () => {
    runStep.mockResolvedValue(undefined);
    expect(await (await post({ step: 'finish', state: {} })).json()).toEqual({ result: null });
  });
});
