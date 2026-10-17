import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_SCENE, SCENES, isSceneKey, scenePhoto } from './scenes';

describe('the scene library', () => {
  it('every scene’s photo is a file the site serves, with a key matching its name', () => {
    for (const [key, scene] of Object.entries(SCENES)) {
      expect(scene.key).toBe(key);
      expect(scene.url.startsWith('/scenes/')).toBe(true);
      expect(existsSync(join(process.cwd(), 'public', scene.url))).toBe(true);
      expect(scene.suits.length).toBeGreaterThan(0);
    }
  });

  it('has the default scene, and keys the database accepts', () => {
    expect(isSceneKey(DEFAULT_SCENE)).toBe(true);
    for (const key of Object.keys(SCENES)) expect(key).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('a library scene paints its photo at its focus; an unknown one falls back to the default', () => {
    expect(scenePhoto('marsh')).toEqual({ url: '/scenes/marsh.webp', focus: 'center 62%' });
    expect(scenePhoto('nowhere')).toEqual(scenePhoto(DEFAULT_SCENE));
    expect(isSceneKey('toString')).toBe(false);
  });
});
