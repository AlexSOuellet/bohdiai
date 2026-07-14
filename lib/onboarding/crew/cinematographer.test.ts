import { describe, it, expect, vi, beforeEach } from 'vitest';

const create = vi.fn();
vi.mock('@/lib/anthropic', () => ({ anthropicClient: () => ({ messages: { create } }) }));

import { shootMoment, MomentSceneSchema, buildCinematographerPrompt } from './cinematographer';
import type { Trajectory } from './trajectory';

const trajectory: Trajectory = {
  feeling: 'the quiet pride of carrying something built to outlast you',
  customerWhy: 'people want one good thing that ages with them',
  visualWorld: 'warm and worn, low light, deep shadow',
  heroConcept: 'a hand resting on a worn bench, dust drifting in a slow shaft of light',
  register: 'restrained',
  heroKind: 'video',
};

const story = ['Built by hand', 'Made to outlast you'];

const scene = {
  kind: 'video' as const,
  prompt: {
    composition: 'wide low angle across a worn bench',
    subject: 'a still hand resting on leather',
    environment: 'a dim workshop',
    atmosphere: 'quiet and still',
    camera: 'static wide shot, 35mm',
    lighting: 'a single shaft of window light',
    style: 'warm filmic grade',
  },
  alt: 'a hand resting on leather in a dim workshop',
};

function toolMsg(input: unknown) {
  return { content: [{ type: 'tool_use', id: 't_moment', name: 'set_moment', input }], stop_reason: 'tool_use' };
}

beforeEach(() => {
  create.mockReset();
});

describe('shootMoment (the Cinematographer)', () => {
  it('returns the validated moment scene from a valid first call', async () => {
    create.mockResolvedValueOnce(toolMsg(scene));
    const s = await shootMoment(trajectory, story);
    expect(s.kind).toBe('video');
    expect(s.prompt.lighting).toBe('a single shaft of window light');
    expect(MomentSceneSchema.safeParse(s).success).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('feeds the heroConcept and story into the prompt and forces the tool', async () => {
    create.mockResolvedValueOnce(toolMsg(scene));
    await shootMoment(trajectory, story);
    const args = create.mock.calls[0]![0] as { system: string; tool_choice?: unknown };
    expect(args.system).toContain(trajectory.heroConcept);
    expect(args.system).toContain('Built by hand');
    expect(args.tool_choice).toEqual({ type: 'tool', name: 'set_moment' });
  });

  it('accepts still as a real choice (the director calls it — not every scene has natural motion)', async () => {
    // The director sets heroKind — the trajectory and the returned kind must agree.
    create.mockResolvedValueOnce(toolMsg({ ...scene, kind: 'still' }));
    const s = await shootMoment({ ...trajectory, heroKind: 'still' }, story);
    expect(s.kind).toBe('still');
  });

  it('rejects an incomplete scene, then accepts the fix', async () => {
    const bad = { ...scene, prompt: { ...scene.prompt, composition: '' } }; // empty — fails the non-empty floor
    create.mockResolvedValueOnce(toolMsg(bad)).mockResolvedValueOnce(toolMsg(scene));
    const s = await shootMoment(trajectory, story);
    expect(s.prompt.composition).toBe('wide low angle across a worn bench');
    expect(create).toHaveBeenCalledTimes(2);
    const second = create.mock.calls[1]![0] as { messages: Array<{ role: string; content: unknown }> };
    expect(JSON.stringify(second.messages.at(-1))).toContain('composition');
  });

  it('accepts a long alt as-is and never reshoots for its length — alt is non-structural copy and must never fail the build (D53)', async () => {
    const longAlt = 'a'.repeat(300); // well past the old 240 cap
    create.mockResolvedValue(toolMsg({ ...scene, alt: longAlt }));
    const s = await shootMoment(trajectory, story);
    expect(s.alt).toBe(longAlt);
    expect(create).toHaveBeenCalledTimes(1); // valid on the first shot — no length reshoot
  });

  it('throws when no valid moment is produced within the attempt cap', async () => {
    create.mockResolvedValue(toolMsg({ ...scene, alt: 'x' })); // too short
    await expect(shootMoment(trajectory, story)).rejects.toThrow(/valid moment/);
    expect(create).toHaveBeenCalledTimes(4);
  });

  it('throws if the model never calls the tool', async () => {
    create.mockResolvedValueOnce({ content: [{ type: 'text', text: 'cut' }], stop_reason: 'end_turn' });
    await expect(shootMoment(trajectory, story)).rejects.toThrow(/did not call set_moment/);
  });

  it('rejects a scene whose style asks for text/title/lettering in frame, then accepts the fix', async () => {
    const lettered = { ...scene, prompt: { ...scene.prompt, style: 'warm filmic grade with a slab-serif title hand-set in the lower-right corner' } };
    create.mockResolvedValueOnce(toolMsg(lettered)).mockResolvedValueOnce(toolMsg(scene));
    const s = await shootMoment(trajectory, story);
    expect(s.prompt.style).toBe('warm filmic grade');
    expect(create).toHaveBeenCalledTimes(2);
    const second = create.mock.calls[1]![0] as { messages: Array<{ role: string; content: unknown }> };
    const lastMsg = JSON.stringify(second.messages.at(-1));
    expect(lastMsg).toContain('style');
    expect(lastMsg.toLowerCase()).toMatch(/text|letter/);
  });

  it('exposes the no-text-in-image physics rule in the prompt', async () => {
    create.mockResolvedValueOnce(toolMsg(scene));
    await shootMoment(trajectory, story);
    const args = create.mock.calls[0]![0] as { system: string };
    expect(args.system.toLowerCase()).toContain('no text');
  });

  it('rejects a video whose camera moves (it breaks the seamless loop), then accepts a locked camera', async () => {
    const moving = { ...scene, prompt: { ...scene.prompt, camera: 'locked-off lens breathing slightly, slow rack focus drifting from the foot to the rim' } };
    create.mockResolvedValueOnce(toolMsg(moving)).mockResolvedValueOnce(toolMsg(scene));
    const s = await shootMoment(trajectory, story);
    expect(s.prompt.camera).toBe('static wide shot, 35mm');
    expect(create).toHaveBeenCalledTimes(2);
    const second = create.mock.calls[1]![0] as { messages: Array<{ role: string; content: unknown }> };
    const lastMsg = JSON.stringify(second.messages.at(-1)).toLowerCase();
    expect(lastMsg).toContain('camera');
    expect(lastMsg).toMatch(/loop|locked|static|movement/);
  });

  it('does not apply the locked-camera rule to a still (it does not loop — the CSS push-in is the only motion)', async () => {
    // The director calls still — trajectory and returned kind must agree.
    create.mockResolvedValueOnce(toolMsg({ ...scene, kind: 'still', prompt: { ...scene.prompt, camera: 'a slow pan across the bench' } }));
    const s = await shootMoment({ ...trajectory, heroKind: 'still' }, story);
    expect(s.kind).toBe('still');
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('directs a locked camera with motion from within the frame for video', async () => {
    create.mockResolvedValueOnce(toolMsg(scene));
    await shootMoment(trajectory, story);
    const sys = (create.mock.calls[0]![0] as { system: string }).system.toLowerCase();
    expect(sys).toMatch(/locked|static|hold the camera/);
    expect(sys).toMatch(/within the frame|in the frame|from the scene/);
  });

  it('tells the cinematographer to execute the director\'s kind, not pick one (D33 — cinematic is not always video)', async () => {
    create.mockResolvedValueOnce(toolMsg(scene));
    await shootMoment(trajectory, story);
    const sys = (create.mock.calls[0]![0] as { system: string }).system;
    // The director has already made the call — the cinematographer executes, not deliberates.
    expect(sys).toMatch(/director has called for|execute that call/i);
    // The old "reach for video / last resort" language is gone — the kind decision
    // belongs to the director, not this stage.
    expect(sys).not.toMatch(/reach for video|last resort|prefer video|video by default/i);
  });

  // --- Task 4: cinematographer executes the director's kind ---

  it("returns a scene with kind 'video' when the trajectory calls for video", async () => {
    create.mockResolvedValueOnce(toolMsg({ ...scene, kind: 'video' }));
    const s = await shootMoment({ ...trajectory, heroKind: 'video' }, story);
    expect(s.kind).toBe('video');
  });

  it("returns a scene with kind 'still' when the trajectory calls for still (D54 — a real scene, not a void)", async () => {
    const stillScene = {
      ...scene,
      kind: 'still' as const,
      prompt: {
        ...scene.prompt,
        // environment is a real space — a kitchen counter at morning light
        environment: 'a kitchen counter beside a sunlit window with a folded linen',
      },
    };
    create.mockResolvedValueOnce(toolMsg(stillScene));
    const s = await shootMoment({ ...trajectory, heroKind: 'still' }, story);
    expect(s.kind).toBe('still');
  });

  it("rejects a returned kind of 'image' — the cinematographer no longer produces images", async () => {
    // 'image' no longer parses through MomentSceneSchema; every attempt comes back
    // with kind: 'image' and fails the schema parse, exhausting the retry cap.
    create.mockResolvedValue(toolMsg({ ...scene, kind: 'image' }));
    await expect(shootMoment(trajectory, story)).rejects.toThrow(/valid moment/);
    expect(create).toHaveBeenCalledTimes(4); // exhausted the attempt cap
  });

  it("includes still-scene branch wording in the prompt when heroKind is 'still' (D54 — scene-in-world, not product-on-void)", () => {
    const stillTrajectory: Trajectory = { ...trajectory, heroKind: 'still' };
    const prompt = buildCinematographerPrompt(stillTrajectory, story);
    // Prompt must announce the director's call and instruct the cinematographer to set kind to "still"
    expect(prompt).toContain('STILL');
    expect(prompt).toContain('Set kind to "still"');
    // Still-scene framing: the product in its real environment, not on a void
    expect(prompt.toLowerCase()).toMatch(/real environment|its real environment|not on a void|product card/);
    // Pure black backgrounds are explicitly FORBIDDEN
    expect(prompt.toLowerCase()).toMatch(/pure black or any solid void/);
  });

  it("retains the camera-locked + in-frame-motion direction in the prompt when heroKind is 'video'", () => {
    const videoTrajectory: Trajectory = { ...trajectory, heroKind: 'video' };
    const prompt = buildCinematographerPrompt(videoTrajectory, story);
    // Prompt must announce the director's call for VIDEO
    expect(prompt).toContain('VIDEO');
    expect(prompt).toContain('Set kind to "video"');
    // Camera-physics rule must still be present for video
    expect(prompt.toLowerCase()).toMatch(/locked|static|hold the camera/);
    expect(prompt.toLowerCase()).toMatch(/within the frame|in the frame/);
  });

  it('does not apply the locked-camera rule to a still (it is a held image — the CSS push-in is the only motion)', async () => {
    // A still scene with a camera field that mentions motion should still pass,
    // because the camera-movement guard is scoped to kind === 'video' only.
    const stillWithMotionCamera = {
      ...scene,
      kind: 'still' as const,
      prompt: { ...scene.prompt, camera: 'a slow pan across the bench' },
    };
    create.mockResolvedValueOnce(toolMsg(stillWithMotionCamera));
    const s = await shootMoment({ ...trajectory, heroKind: 'still' }, story);
    expect(s.kind).toBe('still');
    expect(create).toHaveBeenCalledTimes(1); // no reshoot — camera guard skipped for still
  });

  // --- Task 8: kind-vs-trajectory cross-check ---

  it('rejects a returned kind that does not match the trajectory and asks for a reshoot', async () => {
    // Trajectory says still; model returns video on the first attempt, then still on retry.
    const stillTrajectory: Trajectory = { ...trajectory, heroKind: 'still' };
    const stillScene = { ...scene, kind: 'still' as const, prompt: { ...scene.prompt, environment: 'pure black void' } };
    // First attempt: wrong kind (video) — should trigger the kind-mismatch issue.
    // Second attempt: correct kind (still) — should resolve.
    create
      .mockResolvedValueOnce(toolMsg({ ...scene, kind: 'video' }))
      .mockResolvedValueOnce(toolMsg(stillScene));

    const s = await shootMoment(stillTrajectory, story);
    expect(s.kind).toBe('still');
    expect(create).toHaveBeenCalledTimes(2);

    // The reshoot message must reference the kind mismatch.
    const second = create.mock.calls[1]![0] as { messages: Array<{ role: string; content: unknown }> };
    const lastMsg = JSON.stringify(second.messages.at(-1)).toLowerCase();
    expect(lastMsg).toContain('director');
    expect(lastMsg).toContain('still');
  });

  it('passes through when kind matches the trajectory — no reshoot triggered', async () => {
    // Trajectory says video, model returns video — no kind-mismatch issue, resolves on first attempt.
    create.mockResolvedValueOnce(toolMsg({ ...scene, kind: 'video' }));
    const s = await shootMoment({ ...trajectory, heroKind: 'video' }, story);
    expect(s.kind).toBe('video');
    expect(create).toHaveBeenCalledTimes(1);
  });

  // --- Collage shots: the Cinematographer also designs the Collage hero's 3 stills ---

  it('asks the cinematographer to also design three still collage shots', () => {
    const prompt = buildCinematographerPrompt(trajectory, story);
    expect(prompt.toLowerCase()).toContain('collage');
    expect(prompt).toMatch(/three|3/);
  });

  it('passes through the three collage shots when the model provides them', async () => {
    const withShots = {
      ...scene,
      collageShots: [
        { prompt: scene.prompt, alt: 'a stack of folded goods' },
        { prompt: scene.prompt, alt: 'a close detail on the grain' },
        { prompt: scene.prompt, alt: 'the shelf in the studio' },
      ],
    };
    create.mockResolvedValueOnce(toolMsg(withShots));
    const s = await shootMoment(trajectory, story);
    expect(s.collageShots).toHaveLength(3);
    expect(s.collageShots![0]!.alt).toBe('a stack of folded goods');
  });

  it('still returns a valid scene when the model omits collage shots (optional — degrades, never fails the build)', async () => {
    create.mockResolvedValueOnce(toolMsg(scene));
    const s = await shootMoment(trajectory, story);
    expect(s.collageShots).toBeUndefined();
    expect(MomentSceneSchema.safeParse(s).success).toBe(true);
  });

  it("publishes a real input_schema on set_moment (regression: don't drift back to the {} additionalProperties passthrough)", async () => {
    create.mockResolvedValueOnce(toolMsg(scene));
    await shootMoment(trajectory, story);
    const args = create.mock.calls[0]![0] as { tools: Array<{ name: string; input_schema: { type: string; properties: Record<string, unknown>; required?: string[] } }> };
    const tool = args.tools.find((t) => t.name === 'set_moment');
    expect(tool).toBeDefined();
    expect(tool!.input_schema.type).toBe('object');
    expect(Object.keys(tool!.input_schema.properties)).toEqual(
      expect.arrayContaining(['kind', 'prompt', 'alt', 'collageShots']),
    );
    expect(tool!.input_schema.required).toEqual(expect.arrayContaining(['kind', 'prompt', 'alt']));
    // The seven scene-prompt phrases are all required inside the nested prompt.
    const promptSchema = (tool!.input_schema.properties as { prompt: { properties: Record<string, unknown>; required: string[] } }).prompt;
    expect(promptSchema.required).toEqual(
      expect.arrayContaining(['composition', 'subject', 'environment', 'atmosphere', 'camera', 'lighting', 'style']),
    );
  });

  it("threads the withTimeout AbortSignal through to messages.create so a timed-out call actually cancels", async () => {
    create.mockResolvedValueOnce(toolMsg(scene));
    await shootMoment(trajectory, story);
    const options = create.mock.calls[0]![1] as { signal?: AbortSignal } | undefined;
    expect(options?.signal).toBeInstanceOf(AbortSignal);
  });
});

