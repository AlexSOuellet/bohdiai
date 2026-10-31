import { describe, it, expect, vi } from 'vitest';
import { runSequence, type StepInput } from './build-sequence';

const state = (family: string) => ({ intakeId: 'i1', tenantId: 't1', subdomain: 'fern', family, skin: 's', sceneKeys: ['fern-1', 'fern-2'] });
const plans = [
  { picture: 'a', tags: [] },
  { picture: 'b', tags: [] },
];

function runner(family: string, failAt?: string) {
  const order: string[] = [];
  const opts: Record<string, boolean> = {};
  const run = vi.fn(async (name: string, input: StepInput, o: { retry: boolean }) => {
    order.push(name);
    opts[name] = o.retry;
    if (name === failAt) throw new Error(`${name} broke`);
    if (input.step === 'prepare') return state(family);
    if (input.step === 'plan') return plans;
    if (input.step === 'draft') return { drafted: true };
    return null;
  });
  return { run, order, opts };
}

describe('runSequence', () => {
  it('builds the site first, then the background photos after "your site is ready"', async () => {
    const { run, order, opts } = runner('rustic');
    await runSequence('i1', run);
    expect(order).toEqual(['prepare', 'draft words', 'write site', 'finish', 'plan backgrounds', 'background 1', 'background 2', 'attach background']);
    expect(opts['write site']).toBe(false);
    expect(opts['draft words']).toBe(true);
    expect(run).toHaveBeenCalledWith('write site', { step: 'write', state: state('rustic'), drafts: { drafted: true } }, { retry: false });
  });

  it('makes Scenic’s background photos first, since its page needs one', async () => {
    const { run, order } = runner('scenic');
    await runSequence('i1', run);
    expect(order).toEqual(['prepare', 'plan backgrounds', 'background 1', 'background 2', 'draft words', 'write site', 'finish']);
  });

  it('tells Alex which form and why when a step fails, and stops', async () => {
    const { run, order } = runner('rustic', 'draft words');
    await expect(runSequence('i1', run)).rejects.toThrow('draft words broke');
    expect(order).toEqual(['prepare', 'draft words', 'tell Alex']);
    expect(run).toHaveBeenLastCalledWith('tell Alex', { step: 'failed', intakeId: 'i1', error: 'draft words broke' }, { retry: true });
  });
});
