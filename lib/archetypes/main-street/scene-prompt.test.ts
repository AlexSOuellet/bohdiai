import { describe, it, expect } from 'vitest';
import { sceneToPrompt, sceneToVideoPrompt, sceneToStillPrompt } from './scene-prompt';
import type { ScenePrompt } from './schemas';

const scene: ScenePrompt = {
  composition: 'tight overhead on a cracked loaf',
  subject: 'steam rising slowly',
  environment: 'a warm kitchen bench',
  atmosphere: 'quiet and unhurried',
  camera: 'locked off, shallow depth',
  lighting: 'soft golden window light',
  style: 'photographic, filmic grain',
};

describe('sceneToVideoPrompt', () => {
  it('emits JSON carrying every group plus a seamless-loop and slow-motion intent', () => {
    const out = JSON.parse(sceneToVideoPrompt(scene));
    expect(out.composition).toBe(scene.composition);
    expect(out.subject).toBe(scene.subject);
    expect(out.lighting).toBe(scene.lighting);
    expect(String(out.loop).toLowerCase()).toContain('seamless');
    expect(String(out.motion).toLowerCase()).toContain('slow');
  });
});

describe('sceneToStillPrompt', () => {
  it('joins the groups into a prose description with no loop intent', () => {
    const out = sceneToStillPrompt(scene);
    expect(out).toContain('tight overhead on a cracked loaf');
    expect(out).toContain('soft golden window light');
    expect(out.toLowerCase()).not.toContain('loop');
  });
});

describe('sceneToPrompt', () => {
  it('routes video to JSON and still to prose', () => {
    expect(() => JSON.parse(sceneToPrompt(scene, 'video'))).not.toThrow();
    expect(() => JSON.parse(sceneToPrompt(scene, 'still'))).toThrow();
  });
});
