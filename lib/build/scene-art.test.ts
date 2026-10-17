import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { cleanTags, finishScene, makeScenes, planScenes, sceneKeys, sceneRequest, sceneSystemPrompt, SCENE_HEIGHT, SCENE_WIDTH, type MadeScene, type ScenePainter } from './scene-art';

const brief = { businessName: 'Classic Loafs', makes: 'Sourdough and country loaves', about: 'I bake at home on weekends.' };

/** A stand-in Claude that answers with the given plans (or stop reason). */
function fakeClient(reply: { stop_reason?: string; parsed_output?: unknown }) {
  const calls: unknown[] = [];
  const client = {
    messages: {
      parse: async (args: unknown) => {
        calls.push(args);
        return { stop_reason: 'end_turn', ...reply };
      },
    },
  } as unknown as Parameters<typeof planScenes>[0];
  return { client, calls };
}

const plans = (n: number) => ({ scenes: Array.from({ length: n }, (_, i) => ({ picture: `A quiet wide room in soft morning light, number ${i + 1}, open wall above.`, tags: ['Kitchen', 'morning light', 'kitchen', 'bakery!'] })) });

/** A plain photo of one brightness, as the painter would send back. */
const flat = (v: number, w = 1024, h = 576) => sharp({ create: { width: w, height: h, channels: 3, background: { r: v, g: v, b: v } } }).jpeg().toBuffer();

describe('the prompt', () => {
  it('asks for calm places, quiet at the top, with no people, text or the maker’s own pieces, and carries no sample wording', () => {
    const p = sceneSystemPrompt();
    expect(p).toContain('upper two thirds');
    expect(p).toContain('Never show people');
    expect(p).toContain('never try to show the maker’s own pieces');
    expect(p).not.toMatch(/for example|e\.g\.|such as|like a /i);
  });
  it('gives the maker’s own words and how many', () => {
    const r = sceneRequest(brief, 3);
    expect(r).toContain('Plan 3 background photographs');
    expect(r).toContain('Sourdough and country loaves');
    expect(r).toContain('I bake at home on weekends.');
  });
});

describe('cleanTags', () => {
  it('lowercases, trims, drops punctuation and repeats', () => {
    expect(cleanTags([' Kitchen ', 'kitchen', 'Bakery!', 'morning  light', '!!'])).toEqual(['kitchen', 'bakery', 'morning light']);
  });
});

describe('sceneKeys', () => {
  it('names a site’s scenes after it, skipping names already taken', () => {
    expect(sceneKeys('classic-loafs', 3, new Set(['classic-loafs-2']))).toEqual(['classic-loafs-1', 'classic-loafs-3', 'classic-loafs-4']);
  });
});

describe('finishScene', () => {
  it('saves at full-screen size and reads a dark photo as dark, a light one as light', async () => {
    const dark = await finishScene(await flat(40));
    expect(dark.tone).toBe('dark');
    const meta = await sharp(dark.webp).metadata();
    expect([meta.width, meta.height, meta.format]).toEqual([SCENE_WIDTH, SCENE_HEIGHT, 'webp']);
    expect((await finishScene(await flat(220))).tone).toBe('light');
  });
});

describe('planScenes', () => {
  it('asks Claude for exactly that many and cleans the tags', async () => {
    const { client, calls } = fakeClient({ parsed_output: plans(2) });
    const r = await planScenes(client, brief, 2);
    expect(r.ok && r.scenes.map((s) => s.tags)).toEqual([['kitchen', 'morning light', 'bakery'], ['kitchen', 'morning light', 'bakery']]);
    expect((calls[0] as { model: string }).model).toBe('claude-opus-5-5');
  });
  it('makes two to four, says so otherwise, and says when Claude declines or the reply is off', async () => {
    expect(await planScenes(fakeClient({}).client, brief, 5)).toEqual({ ok: false, error: 'a Scenic build makes 2 to 4 photos, not 5' });
    expect(await planScenes(fakeClient({ stop_reason: 'refusal' }).client, brief, 2)).toEqual({ ok: false, error: 'Claude declined to plan the background photos' });
    expect(await planScenes(fakeClient({ stop_reason: 'max_tokens' }).client, brief, 2)).toEqual({ ok: false, error: 'the background photo plans ran out of room' });
    expect(await planScenes(fakeClient({ parsed_output: null }).client, brief, 2)).toEqual({ ok: false, error: 'the background photo plans didn’t come back in shape' });
  });
});

describe('makeScenes', () => {
  const painter = (fail = -1): ScenePainter => {
    let n = 0;
    return {
      paint: async () => {
        n += 1;
        if (n - 1 === fail) throw new Error('the painter is down');
        return flat(n === 1 ? 30 : 230);
      },
      enlarge: async (photo) => photo,
    };
  };

  it('paints, measures and stores one photo per name, then adds them all to the library', async () => {
    const stored: string[] = [];
    const added: MadeScene[][] = [];
    const r = await makeScenes(
      { client: fakeClient({ parsed_output: plans(2) }).client, painter: painter(), store: async (key) => { stored.push(key); return `https://cdn/${key}.webp`; }, add: async (s) => { added.push([...s]); } },
      brief,
      ['classic-loafs-1', 'classic-loafs-2'],
    );
    expect(r.ok && r.scenes.map((s) => [s.key, s.tone, s.url])).toEqual([
      ['classic-loafs-1', 'dark', 'https://cdn/classic-loafs-1.webp'],
      ['classic-loafs-2', 'light', 'https://cdn/classic-loafs-2.webp'],
    ]);
    expect(stored).toEqual(['classic-loafs-1', 'classic-loafs-2']);
    expect(added).toHaveLength(1);
    expect(added[0]?.[0]?.description).toContain('A quiet wide room');
  });

  it('stops at the first failed photo, says which, and adds nothing', async () => {
    const added: MadeScene[][] = [];
    const r = await makeScenes(
      { client: fakeClient({ parsed_output: plans(2) }).client, painter: painter(1), store: async (key) => key, add: async (s) => { added.push([...s]); } },
      brief,
      ['a-1', 'a-2'],
    );
    expect(r).toEqual({ ok: false, error: 'background photo 2 of 2 failed: the painter is down' });
    expect(added).toHaveLength(0);
  });
});
