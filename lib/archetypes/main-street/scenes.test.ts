import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { SCENE_KEY, SCENIC_PREVIEW } from './scenes';

describe('Scenic’s preview picture', () => {
  it('is a file the site serves', () => {
    expect(existsSync(join(process.cwd(), 'public', SCENIC_PREVIEW.url))).toBe(true);
  });
});

describe('SCENE_KEY', () => {
  it('takes lowercase words joined by dashes, as the library table does', () => {
    expect(SCENE_KEY.test('classic-loafs-1')).toBe(true);
    expect(SCENE_KEY.test('marsh')).toBe(true);
    expect(SCENE_KEY.test('Marsh')).toBe(false);
    expect(SCENE_KEY.test('a--b')).toBe(false);
    expect(SCENE_KEY.test('')).toBe(false);
  });
});
