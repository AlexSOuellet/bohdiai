import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { WORK, CLIENTS, SAMPLES } from './work';

describe('the work list', () => {
  it('has two clients then three samples', () => {
    expect(CLIENTS.map((w) => w.name)).toEqual(['Cut-Pro Lawncare & Construction', 'Decoupage Digital Designs']);
    expect(SAMPLES.map((w) => w.name)).toEqual(['Classic Loafs', 'Twilight to Darkness', 'Heavenly Scents']);
    expect(WORK).toEqual([...CLIENTS, ...SAMPLES]);
    expect(CLIENTS.every((w) => w.kind === 'client')).toBe(true);
    expect(SAMPLES.every((w) => w.kind === 'sample')).toBe(true);
  });

  it('gives every site an https url whose host is what the address bar shows', () => {
    for (const w of WORK) {
      expect(new URL(w.url).protocol).toBe('https:');
      expect(new URL(w.url).host).toBe(w.host);
    }
  });

  it('has a screenshot on disk for every site', () => {
    for (const w of WORK) expect(existsSync(path.join(process.cwd(), 'public', w.shot))).toBe(true);
  });

  it('never mentions follower counts', () => {
    for (const w of WORK) expect(w.blurb).not.toMatch(/follower|thousand|\d+k/i);
  });
});
