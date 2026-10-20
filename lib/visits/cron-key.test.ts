import { describe, it, expect } from 'vitest';
import { cronKey, isCronKey } from './cron-key';

const SECRET = 'x'.repeat(40);

describe('cronKey', () => {
  it('is fixed for a job and differs between jobs and secrets', async () => {
    const a = await cronKey(SECRET, 'visit-months');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await cronKey(SECRET, 'visit-months')).toBe(a);
    expect(await cronKey(SECRET, 'other')).not.toBe(a);
    expect(await cronKey('y'.repeat(40), 'visit-months')).not.toBe(a);
  });
  it('needs a real secret', async () => {
    expect(await cronKey(undefined, 'visit-months')).toBeNull();
    expect(await cronKey('short', 'visit-months')).toBeNull();
  });
});

describe('isCronKey', () => {
  it('opens only for the right key', async () => {
    const key = await cronKey(SECRET, 'visit-months');
    expect(await isCronKey(SECRET, 'visit-months', key)).toBe(true);
    expect(await isCronKey(SECRET, 'visit-months', `${key!.slice(0, -1)}0` === key ? `${key!.slice(0, -1)}1` : `${key!.slice(0, -1)}0`)).toBe(false);
    expect(await isCronKey(SECRET, 'visit-months', 'abc')).toBe(false);
    expect(await isCronKey(SECRET, 'visit-months', null)).toBe(false);
    expect(await isCronKey(undefined, 'visit-months', key)).toBe(false);
  });
});
