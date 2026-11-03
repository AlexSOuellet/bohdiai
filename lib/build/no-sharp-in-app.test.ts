// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Every source file under a folder, tests left out. */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

describe('the app never loads sharp (Session 119)', () => {
  // sharp can't run on Cloudflare, and on the dev server it stops Cloudflare's own
  // image simulator from loading, so the site form's photos fail. Only the hand-run
  // scripts finish photos with it, through scene-finish-sharp.ts.
  it('only scene-finish-sharp.ts imports it, and nothing in the app imports that', () => {
    const files = [...sources('app'), ...sources('lib'), ...sources('components')];
    const sharp = files.filter((f) => /from ['"]sharp['"]/.test(readFileSync(f, 'utf8')));
    expect(sharp.map((f) => f.replace(/\\/g, '/'))).toEqual(['lib/build/scene-finish-sharp.ts']);
    const usesIt = files.filter((f) => /from ['"][^'"]*scene-finish-sharp['"]/.test(readFileSync(f, 'utf8')) && !f.endsWith('scene-finish-sharp.ts'));
    expect(usesIt).toEqual([]);
  });
});
