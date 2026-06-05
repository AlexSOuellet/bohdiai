/**
 * Serialize Bohdi's STRUCTURED hero scene into the single text prompt the
 * generation provider takes.
 *
 *  - VIDEO → a JSON object (video models follow grouped JSON better than prose),
 *    with a seamless-loop + slow-motion intent injected so the clip starts and
 *    ends on the same frame with no cut, flash, or jump on the restart.
 *  - STILL → a prose join of the groups (image models read prose); no loop.
 *
 * The groups are the archetype's; Bohdi only fills them. Keeping the seam here
 * means the schema stays declarative and the provider call stays dumb.
 */
import type { ScenePrompt } from './schemas';

const SEAMLESS_LOOP =
  'the clip must start and end on the same frame and loop seamlessly — no cut, flash, fade, or jump at the restart';
const SLOW_MOTION = 'slow, continuous, ambient motion only — no fast cuts, no camera moves that reframe';

export function sceneToVideoPrompt(scene: ScenePrompt): string {
  return JSON.stringify({
    composition: scene.composition,
    subject: scene.subject,
    environment: scene.environment,
    atmosphere: scene.atmosphere,
    camera: scene.camera,
    lighting: scene.lighting,
    style: scene.style,
    motion: SLOW_MOTION,
    loop: SEAMLESS_LOOP,
  });
}

export function sceneToStillPrompt(scene: ScenePrompt): string {
  return [scene.composition, scene.subject, scene.environment, scene.lighting, scene.atmosphere, scene.style]
    .map((s) => s.trim())
    .filter(Boolean)
    .join('. ');
}

export function sceneToPrompt(scene: ScenePrompt, kind: 'video' | 'still'): string {
  return kind === 'video' ? sceneToVideoPrompt(scene) : sceneToStillPrompt(scene);
}
